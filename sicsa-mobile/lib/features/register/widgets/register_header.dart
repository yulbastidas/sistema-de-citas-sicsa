import 'package:flutter/material.dart';

class RegisterHeader extends StatelessWidget {
  const RegisterHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Icon(
          Icons.assignment_ind_outlined,
          color: Color(0xFF0F766E),
          size: 48,
        ),
        const SizedBox(height: 12),
        Text(
          'Datos personales',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Ingresa tus datos para finalizar el registro. Luego recibirás un código en tu correo.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF64748B)),
        ),
      ],
    );
  }
}