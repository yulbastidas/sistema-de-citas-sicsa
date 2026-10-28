import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../services/auth_service.dart';
import '../widgets/auth_card.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _service = AuthService();
  final _identifier = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  int _step = 1;
  bool _phone = false;
  bool _loading = false;
  String? _challengeId;
  String? _resetToken;
  String? _message;

  @override
  void dispose() {
    _identifier.dispose();
    _code.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _continue() async {
    final value = _identifier.text.trim();
    if (_step == 1 &&
        ((_phone && !RegExp(r'^3\d{9}$').hasMatch(value)) ||
            (!_phone &&
                !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value)))) {
      setState(() => _message = _phone
          ? 'Ingresa un celular colombiano válido'
          : 'Ingresa un correo válido');
      return;
    }
    if (_step == 2 && !RegExp(r'^\d{6}$').hasMatch(_code.text.trim())) {
      setState(() => _message = 'El código debe tener seis números');
      return;
    }
    if (_step == 3 &&
        (_password.text.length < 8 ||
            !RegExp(r'[A-Z]').hasMatch(_password.text) ||
            !RegExp(r'[a-z]').hasMatch(_password.text) ||
            !RegExp(r'\d').hasMatch(_password.text) ||
            _password.text != _confirm.text)) {
      setState(() => _message =
          'Usa 8 caracteres, mayúscula, minúscula y número; ambas contraseñas deben coincidir.');
      return;
    }
    setState(() {
      _loading = true;
      _message = null;
    });
    try {
      if (_step == 1) {
        if (_phone) {
          final result = await _service.requestPhoneReset(value);
          _challengeId = result['challengeId']?.toString();
        } else {
          await _service.requestEmailReset(value);
        }
        setState(() => _step = 2);
      } else if (_step == 2) {
        if (_phone) {
          final result = await _service.verifyPhoneReset(
              phone: value, challengeId: _challengeId ?? '', code: _code.text);
          _resetToken = result['resetToken']?.toString();
          if (_resetToken == null) {
            throw Exception('No se recibió autorización de recuperación');
          }
        } else {
          await _service.verifyEmailReset(value, _code.text);
        }
        setState(() => _step = 3);
      } else {
        if (_phone) {
          await _service.resetPhonePassword(
              phone: value,
              resetToken: _resetToken ?? '',
              password: _password.text);
        } else {
          await _service.resetEmailPassword(
              email: value, code: _code.text, password: _password.text);
        }
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Contraseña actualizada correctamente')));
        context.go('/login');
      }
    } catch (error) {
      if (mounted) {
        setState(
            () => _message = error.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Recuperar contraseña')),
        body: SafeArea(
            child: Center(
                child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: AuthCard(
                        child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.lock_reset,
                            size: 58, color: AppColors.secondary),
                        const SizedBox(height: 12),
                        Text('Paso $_step de 3',
                            style:
                                const TextStyle(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 20),
                        if (_step == 1) ...[
                          SegmentedButton<bool>(
                              segments: const [
                                ButtonSegment(
                                    value: false,
                                    label: Text('Correo'),
                                    icon: Icon(Icons.email_outlined)),
                                ButtonSegment(
                                    value: true,
                                    label: Text('Celular'),
                                    icon: Icon(Icons.phone_outlined))
                              ],
                              selected: {
                                _phone
                              },
                              onSelectionChanged: (v) => setState(() {
                                    _phone = v.first;
                                    _identifier.clear();
                                    _message = null;
                                  })),
                          const SizedBox(height: 18),
                          TextField(
                              controller: _identifier,
                              keyboardType: _phone
                                  ? TextInputType.phone
                                  : TextInputType.emailAddress,
                              decoration: InputDecoration(
                                  labelText: _phone
                                      ? 'Número de celular'
                                      : 'Correo electrónico',
                                  prefixIcon: Icon(_phone
                                      ? Icons.phone_outlined
                                      : Icons.email_outlined))),
                        ],
                        if (_step == 2)
                          TextField(
                              controller: _code,
                              keyboardType: TextInputType.number,
                              maxLength: 6,
                              decoration: const InputDecoration(
                                  labelText: 'Código de seis dígitos',
                                  prefixIcon: Icon(Icons.pin_outlined))),
                        if (_step == 3) ...[
                          TextField(
                              controller: _password,
                              obscureText: true,
                              decoration: const InputDecoration(
                                  labelText: 'Nueva contraseña',
                                  prefixIcon: Icon(Icons.lock_outline))),
                          const SizedBox(height: 14),
                          TextField(
                              controller: _confirm,
                              obscureText: true,
                              decoration: const InputDecoration(
                                  labelText: 'Confirmar contraseña',
                                  prefixIcon: Icon(Icons.lock_outline))),
                        ],
                        if (_message != null)
                          Padding(
                              padding: const EdgeInsets.only(top: 16),
                              child: Text(_message!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                      color: AppColors.error,
                                      fontWeight: FontWeight.w600))),
                        const SizedBox(height: 24),
                        SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                                onPressed: _loading ? null : _continue,
                                child: Text(_loading
                                    ? 'Procesando...'
                                    : _step == 3
                                        ? 'Cambiar contraseña'
                                        : 'Continuar'))),
                        TextButton(
                            onPressed:
                                _loading ? null : () => context.go('/login'),
                            child: const Text('Volver al inicio de sesión')),
                      ],
                    ))))),
      );
}
