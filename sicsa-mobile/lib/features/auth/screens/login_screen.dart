import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../models/login_model.dart';
import '../services/auth_service.dart';
import '../widgets/auth_card.dart';
import '../widgets/auth_password_field.dart';
import '../widgets/login_header.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  final AuthService _authService = AuthService();

  bool _loading = false;
  bool _showPassword = false;
  String? _error;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final loginModel = LoginModel(
        identifier: _identifierController.text.trim().toLowerCase(),
        password: _passwordController.text.trim(),
      );

      await _authService.login(loginModel);

      if (!mounted) return;

      context.go('/patient/dashboard');
    } on EmailNotVerifiedException catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.warning,
          content: const Text(
            'Debes verificar tu correo antes de iniciar sesión',
          ),
        ),
      );

      context.go('/verify-email', extra: error.email);
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

  String? _identifierValidator(String? value) {
    final identifier = value?.trim() ?? '';
    if (identifier.isEmpty) return 'Ingresa tu correo o celular';
    final email = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(identifier);
    final phone =
        RegExp(r'^(?:3\d{9}|573\d{9}|\+573\d{9})$').hasMatch(identifier);
    if (!email && !phone) return 'Ingresa un correo o celular válido';

    return null;
  }

  String? _passwordValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Ingresa tu contraseña';
    }
    return null;
  }

  void _togglePassword() {
    setState(() {
      _showPassword = !_showPassword;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: AuthCard(
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const LoginHeader(),

                    const SizedBox(height: 32),

                    /// EMAIL
                    TextFormField(
                      controller: _identifierController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Correo electrónico o celular',
                        hintText: 'Correo o celular',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      validator: _identifierValidator,
                    ),

                    const SizedBox(height: 16),

                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _loading
                            ? null
                            : () => context.go('/forgot-password'),
                        child: const Text('¿Olvidaste tu contraseña?'),
                      ),
                    ),

                    /// PASSWORD
                    AuthPasswordField(
                      controller: _passwordController,
                      showPassword: _showPassword,
                      onToggleVisibility: _togglePassword,
                      onFieldSubmitted: (_) => _handleLogin(),
                      validator: _passwordValidator,
                    ),

                    /// ERROR
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: AppColors.error,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 24),

                    /// BOTÓN LOGIN
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _loading ? null : _handleLogin,
                        icon: _loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.login),
                        label: Text(
                          _loading ? 'Ingresando...' : 'Iniciar sesión',
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    /// REGISTER
                    TextButton(
                      onPressed:
                          _loading ? null : () => context.go('/register'),
                      child: const Text('¿No tienes cuenta? Regístrate'),
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
