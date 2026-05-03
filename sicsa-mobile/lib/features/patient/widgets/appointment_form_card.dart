import 'package:flutter/material.dart';
import 'priority_switch.dart';
import 'section_title.dart';

class AppointmentFormCard extends StatelessWidget {
  final int? selectedSpecialtyId;
  final int? selectedAppointmentClassId;
  final DateTime? selectedDate;

  final List<dynamic> specialties;
  final List<dynamic> appointmentClasses;

  final InputDecoration Function({
    required String label,
    required IconData icon,
  }) inputDecoration;

  final String Function(DateTime date) formatDate;
  final VoidCallback pickDate;

  final ValueChanged<int?> onSpecialtyChanged;
  final ValueChanged<int?> onClassChanged;

  final Widget hoursSection;

  final int? edadCalculada;

  final bool embarazada;
  final bool discapacidad;
  final bool dolorIntenso;
  final bool sangrado;
  final bool dificultadRespiratoria;
  final bool fiebre;

  final ValueChanged<bool> onEmbarazadaChanged;
  final ValueChanged<bool> onDiscapacidadChanged;
  final ValueChanged<bool> onDolorIntensoChanged;
  final ValueChanged<bool> onSangradoChanged;
  final ValueChanged<bool> onDificultadRespiratoriaChanged;
  final ValueChanged<bool> onFiebreChanged;

  final TextEditingController motivoController;
  final TextEditingController observacionesController;

  final String? error;
  final bool saving;

  final VoidCallback onBack;
  final VoidCallback onSubmit;

  const AppointmentFormCard({
    super.key,
    required this.selectedSpecialtyId,
    required this.selectedAppointmentClassId,
    required this.selectedDate,
    required this.specialties,
    required this.appointmentClasses,
    required this.inputDecoration,
    required this.formatDate,
    required this.pickDate,
    required this.onSpecialtyChanged,
    required this.onClassChanged,
    required this.hoursSection,
    required this.edadCalculada,
    required this.embarazada,
    required this.discapacidad,
    required this.dolorIntenso,
    required this.sangrado,
    required this.dificultadRespiratoria,
    required this.fiebre,
    required this.onEmbarazadaChanged,
    required this.onDiscapacidadChanged,
    required this.onDolorIntensoChanged,
    required this.onSangradoChanged,
    required this.onDificultadRespiratoriaChanged,
    required this.onFiebreChanged,
    required this.motivoController,
    required this.observacionesController,
    required this.error,
    required this.saving,
    required this.onBack,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionTitle(
            icon: Icons.add_circle_outline,
            title: 'Datos de la cita',
            color: Color(0xFF0F766E),
          ),

          const SizedBox(height: 18),

          /// Especialidad
          DropdownButtonFormField<int>(
            value: selectedSpecialtyId,
            isExpanded: true,
            items: specialties.map((item) {
              final specialty = Map<String, dynamic>.from(item as Map);

              return DropdownMenuItem<int>(
                value: int.parse(specialty['id'].toString()),
                child: Text(
                  specialty['nombre']?.toString() ?? 'Especialidad',
                ),
              );
            }).toList(),
            onChanged: onSpecialtyChanged,
            decoration: inputDecoration(
              label: 'Especialidad',
              icon: Icons.medical_services_outlined,
            ),
          ),

          const SizedBox(height: 16),

          /// Clase de cita
          DropdownButtonFormField<int>(
            value: selectedAppointmentClassId,
            isExpanded: true,
            items: appointmentClasses.map((item) {
              final cls = Map<String, dynamic>.from(item as Map);

              return DropdownMenuItem<int>(
                value: int.parse(cls['id'].toString()),
                child: Text(
                  cls['nombre']?.toString() ?? 'Clase de cita',
                ),
              );
            }).toList(),
            onChanged: onClassChanged,
            decoration: inputDecoration(
              label: 'Clase de cita',
              icon: Icons.category_outlined,
            ),
          ),

          const SizedBox(height: 16),

          /// Fecha
          InkWell(
            onTap: pickDate,
            borderRadius: BorderRadius.circular(16),
            child: InputDecorator(
              decoration: inputDecoration(
                label: 'Fecha',
                icon: Icons.calendar_month_outlined,
              ),
              child: Text(
                selectedDate == null
                    ? 'Selecciona una fecha'
                    : formatDate(selectedDate!),
                style: TextStyle(
                  color: selectedDate == null
                      ? Colors.grey.shade600
                      : Colors.black87,
                ),
              ),
            ),
          ),

          const SizedBox(height: 18),

          const Text(
            'Horarios disponibles',
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),

          const SizedBox(height: 10),

          hoursSection,

          const SizedBox(height: 22),

          /// PRIORIDAD CLÍNICA
          const SectionTitle(
            icon: Icons.health_and_safety_outlined,
            title: 'Datos de prioridad clínica',
            color: Color(0xFFDC2626),
          ),

          const SizedBox(height: 12),

          InputDecorator(
            decoration: inputDecoration(
              label: 'Edad calculada',
              icon: Icons.cake_outlined,
            ),
            child: Text(
              edadCalculada == null
                  ? 'No disponible'
                  : '$edadCalculada años',
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),

          const SizedBox(height: 10),

          PrioritySwitch(
            title: 'Embarazada',
            value: embarazada,
            onChanged: onEmbarazadaChanged,
          ),
          PrioritySwitch(
            title: 'Discapacidad',
            value: discapacidad,
            onChanged: onDiscapacidadChanged,
          ),
          PrioritySwitch(
            title: 'Dolor intenso',
            value: dolorIntenso,
            onChanged: onDolorIntensoChanged,
          ),
          PrioritySwitch(
            title: 'Sangrado',
            value: sangrado,
            onChanged: onSangradoChanged,
          ),
          PrioritySwitch(
            title: 'Dificultad respiratoria',
            value: dificultadRespiratoria,
            onChanged: onDificultadRespiratoriaChanged,
          ),
          PrioritySwitch(
            title: 'Fiebre',
            value: fiebre,
            onChanged: onFiebreChanged,
          ),

          const SizedBox(height: 18),

          /// MOTIVO
          TextFormField(
            controller: motivoController,
            maxLines: 4,
            decoration: inputDecoration(
              label: 'Motivo de consulta',
              icon: Icons.notes_outlined,
            ),
          ),

          const SizedBox(height: 16),

          /// OBSERVACIONES
          TextFormField(
            controller: observacionesController,
            maxLines: 3,
            decoration: inputDecoration(
              label: 'Observaciones (opcional)',
              icon: Icons.edit_note_outlined,
            ),
          ),

          if (error != null) ...[
            const SizedBox(height: 14),
            Text(
              error!,
              style: const TextStyle(
                color: Colors.redAccent,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],

          const SizedBox(height: 22),

          /// BOTONES
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: saving ? null : onBack,
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Volver'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: saving ? null : onSubmit,
                  icon: saving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send_outlined),
                  label: Text(
                    saving ? 'Enviando...' : 'Solicitar cita',
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}