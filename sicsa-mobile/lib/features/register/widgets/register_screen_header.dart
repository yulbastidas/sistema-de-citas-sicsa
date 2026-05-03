import 'package:flutter/material.dart';

class RegisterScreenHeader extends StatelessWidget {
  const RegisterScreenHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 82,
          width: 82,
          decoration: BoxDecoration(
            color: const Color(0xFFCFFAFE),
            borderRadius: BorderRadius.circular(28),
          ),
          child: const Icon(
            Icons.person_add_alt_1,
            size: 42,
            color: Color(0xFF0E7490),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Crear cuenta',
          style: TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Registra tu correo y crea una contraseña segura.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Color(0xFF64748B),
            fontSize: 16,
          ),
        ),
      ],
    );
  }
}