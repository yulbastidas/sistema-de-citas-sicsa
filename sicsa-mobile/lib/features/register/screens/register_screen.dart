import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../models/register_models.dart';
import '../widgets/password_field.dart';
import '../widgets/register_card.dart';
import '../widgets/register_screen_header.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _showPassword = false;
  bool _showConfirmPassword = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _goToProfile() {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() {
        _error = 'Las contraseñas no coinciden';
      });
      return;
    }

    setState(() => _error = null);

    final credentials = RegisterCredentials(
      email: _emailController.text.trim().toLowerCase(),
      password: _passwordController.text,
    );

    context.go('/register/patient-profile', extra: credentials);
  }

  String? _emailValidator(String? value) {
    final email = value?.trim() ?? '';

    if (email.isEmpty) return 'Ingresa tu correo';

    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      return 'Correo inválido';
    }

    return null;
  }

  String? _passwordValidator(String? value) {
    final password = value ?? '';

    if (password.isEmpty) return 'Ingresa tu contraseña';

    if (password.length < 6) return 'Mínimo 6 caracteres';

    return null;
  }

  String? _confirmPasswordValidator(String? value) {
    if (value == null || value.isEmpty) {
      return 'Confirma tu contraseña';
    }
    return null;
  }

  void _togglePassword() {
    setState(() {
      _showPassword = !_showPassword;
    });
  }

  void _toggleConfirmPassword() {
    setState(() {
      _showConfirmPassword = !_showConfirmPassword;
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
            child: RegisterCard(
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const RegisterScreenHeader(),

                    const SizedBox(height: 32),

                    /// EMAIL
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Correo electrónico',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                      validator: _emailValidator,
                    ),

                    const SizedBox(height: 16),

                    /// PASSWORD
                    PasswordField(
                      controller: _passwordController,
                      label: 'Contraseña',
                      showPassword: _showPassword,
                      onToggleVisibility: _togglePassword,
                      textInputAction: TextInputAction.next,
                      validator: _passwordValidator,
                    ),

                    const SizedBox(height: 16),

                    /// CONFIRM PASSWORD
                    PasswordField(
                      controller: _confirmPasswordController,
                      label: 'Confirmar contraseña',
                      showPassword: _showConfirmPassword,
                      onToggleVisibility: _toggleConfirmPassword,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _goToProfile(),
                      validator: _confirmPasswordValidator,
                    ),

                    /// ERROR BONITO
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

                    /// BOTÓN
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _goToProfile,
                        icon: const Icon(Icons.arrow_forward),
                        label: const Text('Siguiente'),
                      ),
                    ),

                    const SizedBox(height: 16),

                    /// LOGIN
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Ya tengo una cuenta'),
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