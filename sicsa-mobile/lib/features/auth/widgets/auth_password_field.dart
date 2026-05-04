import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class AuthPasswordField extends StatelessWidget {
  final TextEditingController controller;
  final bool showPassword;
  final VoidCallback onToggleVisibility;
  final String? Function(String?)? validator;
  final void Function(String)? onFieldSubmitted;

  const AuthPasswordField({
    super.key,
    required this.controller,
    required this.showPassword,
    required this.onToggleVisibility,
    this.validator,
    this.onFieldSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: !showPassword,
      textInputAction: TextInputAction.done,
      onFieldSubmitted: onFieldSubmitted,
      cursorColor: AppColors.primary,

      decoration: InputDecoration(
        labelText: 'Contraseña',
        prefixIcon: const Icon(Icons.lock_outline),
        prefixIconColor: AppColors.textSecondary,

        suffixIcon: IconButton(
          onPressed: onToggleVisibility,
          icon: Icon(
            showPassword
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
          ),
        ),

        /// ESTILO MÁS LIMPIO
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),

        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),

      validator: validator,
    );
  }
}