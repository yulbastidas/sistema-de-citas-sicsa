import 'package:flutter/material.dart';

import 'register_input_decoration.dart';

class BirthDateField extends StatelessWidget {
  final DateTime? fechaNacimiento;
  final int? age;
  final VoidCallback onTap;

  const BirthDateField({
    super.key,
    required this.fechaNacimiento,
    required this.age,
    required this.onTap,
  });

  String _formatDate(DateTime? date) {
    if (date == null) return 'Selecciona fecha de nacimiento';

    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year.toString();

    return '$year-$month-$day';
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: InputDecorator(
        decoration: registerInputDecoration(
          label: 'Fecha de nacimiento',
          icon: Icons.calendar_month_outlined,
        ),
        child: Text(
          age == null
              ? _formatDate(fechaNacimiento)
              : '${_formatDate(fechaNacimiento)} · $age años',
          style: TextStyle(
            color: fechaNacimiento == null ? Colors.grey.shade600 : Colors.black87,
          ),
        ),
      ),
    );
  }
}