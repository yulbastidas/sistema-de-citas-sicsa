import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class LoginHeader extends StatelessWidget {
  const LoginHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        /// ICONO PRINCIPAL
        Container(
          height: 90,
          width: 90,
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(28),
          ),
          child: const Icon(
            Icons.local_hospital_outlined,
            size: 46,
            color: AppColors.primary,
          ),
        ),

        const SizedBox(height: 24),

        /// TÍTULO
        const Text(
          'Bienvenido a SICSA',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: AppColors.textPrimary,
          ),
        ),

        const SizedBox(height: 8),

        /// SUBTÍTULO
        const Text(
          'Sistema de citas médicas',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 15,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}