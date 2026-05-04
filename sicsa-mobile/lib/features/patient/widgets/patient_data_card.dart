import 'package:flutter/material.dart';

class PatientDataCard extends StatelessWidget {
  final String nombre;
  final String documento;
  final String eps;
  final String departamento;
  final String municipio;
  final String fechaNacimiento;
  final String edad;

  const PatientDataCard({
    super.key,
    required this.nombre,
    required this.documento,
    required this.eps,
    required this.departamento,
    required this.municipio,
    required this.fechaNacimiento,
    required this.edad,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.person_pin_outlined, color: Color(0xFF1E3A8A)),
              SizedBox(width: 8),
              Text(
                'Datos del paciente',
                style: TextStyle(
                  color: Color(0xFF1E3A8A),
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _InfoLine(label: 'Nombre', value: nombre),
          _InfoLine(label: 'Documento', value: documento),
          _InfoLine(label: 'EPS', value: eps),
          _InfoLine(label: 'Departamento', value: departamento),
          _InfoLine(label: 'Municipio', value: municipio),
          _InfoLine(label: 'Fecha de nacimiento', value: fechaNacimiento),
          _InfoLine(label: 'Edad calculada', value: edad),
        ],
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  final String label;
  final String value;

  const _InfoLine({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        '$label: $value',
        style: const TextStyle(
          color: Color(0xFF334155),
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}