import 'package:flutter/material.dart';

class VerifyEmailHeader extends StatelessWidget {
  final String email;

  const VerifyEmailHeader({
    super.key,
    required this.email,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 82,
          width: 82,
          decoration: BoxDecoration(
            color: const Color(0xFFDCFCE7),
            borderRadius: BorderRadius.circular(28),
          ),
          child: const Icon(
            Icons.mark_email_read_outlined,
            size: 42,
            color: Color(0xFF16A34A),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Verifica tu correo',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Enviamos un código de 6 dígitos a:\n$email',
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 15,
          ),
        ),
      ],
    );
  }
}