import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../services/register_service.dart';
import '../widgets/register_card.dart';
import '../widgets/verify_email_header.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String email;

  const VerifyEmailScreen({
    super.key,
    required this.email,
  });

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final RegisterService _service = RegisterService();
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();

  bool _loading = false;
  bool _resending = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _verifyCode() async {
    final isValid = _formKey.currentState?.validate() ?? false;

    if (!isValid) return;

    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });

    try {
      await _service.verifyEmailCode(
        email: widget.email,
        code: _codeController.text.trim(),
      );

      if (!mounted) return;

      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Correo verificado'),
          content: const Text(
            'Tu correo fue verificado correctamente. Ahora puedes iniciar sesión.',
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Ir al login'),
            ),
          ],
        ),
      );

      if (!mounted) return;

      context.go('/login');
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _resendCode() async {
    setState(() {
      _resending = true;
      _error = null;
      _success = null;
    });

    try {
      await _service.sendVerificationCode(widget.email);

      if (!mounted) return;

      setState(() {
        _success = 'Código reenviado correctamente';
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _resending = false);
      }
    }
  }

  String? _codeValidator(String? value) {
    final code = value?.trim() ?? '';

    if (code.isEmpty) return 'Ingresa el código';

    if (!RegExp(r'^\d{6}$').hasMatch(code)) {
      return 'El código debe tener 6 números';
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: RegisterCard(
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    VerifyEmailHeader(email: widget.email),

                    const SizedBox(height: 28),

                    TextFormField(
                      controller: _codeController,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 8,
                      ),
                      decoration: const InputDecoration(
                        counterText: '',
                        labelText: 'Código de verificación',
                        prefixIcon: Icon(Icons.pin_outlined),
                      ),
                      validator: _codeValidator,
                    ),

                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.redAccent,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],

                    if (_success != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        _success!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF16A34A),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],

                    const SizedBox(height: 28),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _loading ? null : _verifyCode,
                        icon: _loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.verified_outlined),
                        label: Text(
                          _loading ? 'Verificando...' : 'Verificar correo',
                        ),
                      ),
                    ),

                    const SizedBox(height: 14),

                    TextButton.icon(
                      onPressed: _resending ? null : _resendCode,
                      icon: _resending
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.refresh),
                      label: Text(
                        _resending ? 'Reenviando...' : 'Reenviar código',
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}