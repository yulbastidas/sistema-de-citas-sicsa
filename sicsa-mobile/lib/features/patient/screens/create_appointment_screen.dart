import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../services/appointment_service.dart';
import '../widgets/appointment_form_card.dart';
import '../widgets/patient_data_card.dart';
import '../widgets/patient_header_card.dart';
import '../widgets/waitlist_card.dart';

class CreateAppointmentScreen extends StatefulWidget {
  const CreateAppointmentScreen({super.key});

  @override
  State<CreateAppointmentScreen> createState() =>
      _CreateAppointmentScreenState();
}

class _CreateAppointmentScreenState extends State<CreateAppointmentScreen> {
  final AppointmentService _service = AppointmentService();

  final TextEditingController _motivoController = TextEditingController();
  final TextEditingController _observacionesController =
      TextEditingController();

  bool _loading = true;
  bool _saving = false;
  bool _joiningWaitlist = false;
  String? _error;

  Map<String, dynamic>? _profile;
  List<dynamic> _specialties = [];
  List<dynamic> _appointmentClasses = [];
  List<String> _hours = [];

  int? _selectedSpecialtyId;
  int? _selectedAppointmentClassId;
  DateTime? _selectedDate;
  String? _selectedHour;

  bool _embarazada = false;
  bool _discapacidad = false;
  bool _dolorIntenso = false;
  bool _sangrado = false;
  bool _dificultadRespiratoria = false;
  bool _fiebre = false;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _motivoController.dispose();
    _observacionesController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _service.getMyProfile(),
        _service.getSpecialties(),
        _service.getAppointmentClasses(),
      ]);

      if (!mounted) return;

      setState(() {
        _profile = results[0] as Map<String, dynamic>;
        _specialties = results[1] as List<dynamic>;
        _appointmentClasses = results[2] as List<dynamic>;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _error = 'No se pudieron cargar los datos del paciente';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();

    final selected = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? now,
      firstDate: now,
      lastDate: DateTime(now.year + 1),
    );

    if (selected == null) return;

    setState(() {
      _selectedDate = selected;
      _selectedHour = null;
      _hours = [];
    });

    await _loadAvailableHours();
  }

  Future<void> _loadAvailableHours() async {
    if (_selectedDate == null) return;

    setState(() {
      _loading = true;
      _error = null;
      _selectedHour = null;
      _hours = [];
    });

    try {
      final fecha = _formatDate(_selectedDate!);

      final data = await _service.getAvailableHours(
        fecha: fecha,
        appointmentClassId: _selectedAppointmentClassId,
      );

      if (!mounted) return;

      setState(() {
        _hours = data.map((item) => item.toString()).toList();
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _error = 'No se pudieron cargar los horarios disponibles';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _submit() async {
    if (!_validateBaseFields(requireHour: true)) return;

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await _service.createAppointment(
        fecha: _formatDate(_selectedDate!),
        hora: _selectedHour!,
        motivo: _motivoController.text.trim(),
        specialtyId: _selectedSpecialtyId!,
        appointmentClassId: _selectedAppointmentClassId,
        observaciones: _observacionesController.text.trim(),
        edad: _calcularEdad(),
        embarazada: _embarazada,
        discapacidad: _discapacidad,
        dolorIntenso: _dolorIntenso,
        sangrado: _sangrado,
        dificultadRespiratoria: _dificultadRespiratoria,
        fiebre: _fiebre,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.success,
          content: const Text('Solicitud de cita creada correctamente'),
        ),
      );

      context.go('/patient/appointments');
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  Future<void> _joinWaitlist() async {
    if (!_validateBaseFields(requireHour: false)) return;

    final day = _selectedDate!.weekday;

    if (day == DateTime.sunday || day == DateTime.monday) {
      _showMessage('No puedes unirte a lista de espera en domingo o lunes');
      return;
    }

    setState(() {
      _joiningWaitlist = true;
      _error = null;
    });

    try {
      await _service.createWaitlistAppointment(
        fecha: _formatDate(_selectedDate!),
        horaBase: _getWaitlistBaseHour(_selectedDate!),
        motivo: _motivoController.text.trim(),
        specialtyId: _selectedSpecialtyId!,
        appointmentClassId: _selectedAppointmentClassId,
        observaciones: _observacionesController.text.trim(),
        edad: _calcularEdad(),
        embarazada: _embarazada,
        discapacidad: _discapacidad,
        dolorIntenso: _dolorIntenso,
        sangrado: _sangrado,
        dificultadRespiratoria: _dificultadRespiratoria,
        fiebre: _fiebre,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.secondary,
          content: const Text('Te uniste a la lista de espera correctamente'),
        ),
      );

      context.go('/patient/appointments');
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _joiningWaitlist = false);
      }
    }
  }

  bool _validateBaseFields({required bool requireHour}) {
    if (_selectedSpecialtyId == null) {
      _showMessage('Selecciona una especialidad');
      return false;
    }

    if (_selectedAppointmentClassId == null) {
      _showMessage('Selecciona la clase de cita');
      return false;
    }

    if (_selectedDate == null) {
      _showMessage('Selecciona una fecha');
      return false;
    }

    if (requireHour && _selectedHour == null) {
      _showMessage('Selecciona una hora disponible');
      return false;
    }

    if (_motivoController.text.trim().isEmpty) {
      _showMessage('Escribe el motivo de consulta');
      return false;
    }

    return true;
  }

  String _getWaitlistBaseHour(DateTime date) {
    final day = date.weekday;

    if (day == DateTime.tuesday || day == DateTime.wednesday) {
      return '08:00';
    }

    return '07:00';
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.warning,
        content: Text(message),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year.toString();

    return '$year-$month-$day';
  }

  String _profileText(String key) {
    final value = _profile?[key];

    if (value == null || value.toString().trim().isEmpty) {
      return 'No registrado';
    }

    return value.toString();
  }

  String _fullName() {
    final names = [
      _profile?['primerNombre'],
      _profile?['segundoNombre'],
      _profile?['primerApellido'],
      _profile?['segundoApellido'],
    ]
        .where((item) => item != null && item.toString().trim().isNotEmpty)
        .map((item) => item.toString())
        .join(' ');

    return names.isEmpty ? 'Paciente' : names;
  }

  int? _calcularEdad() {
    final fecha = _profile?['fechaNacimiento'];

    if (fecha == null || fecha.toString().trim().isEmpty) return null;

    final birthDate = DateTime.tryParse(fecha.toString());
    if (birthDate == null) return null;

    final today = DateTime.now();

    int age = today.year - birthDate.year;

    final hasHadBirthdayThisYear =
        today.month > birthDate.month ||
        (today.month == birthDate.month && today.day >= birthDate.day);

    if (!hasHadBirthdayThisYear) {
      age--;
    }

    return age;
  }

  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
    );
  }

  Widget _buildHoursSection() {
    if (_selectedDate == null) {
      return const _InfoBox(
        icon: Icons.calendar_today_outlined,
        title: 'Selecciona una fecha',
        message: 'Después de seleccionar la fecha se cargarán los horarios.',
        color: AppColors.secondary,
        background: Color(0xFFEFF6FF),
      );
    }

    if (_hours.isEmpty) {
      return WaitlistCard(
        loading: _joiningWaitlist,
        onJoinWaitlist: _joinWaitlist,
      );
    }

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: _hours.map((hour) {
        final isSelected = _selectedHour == hour;

        return ChoiceChip(
          label: Text(hour),
          selected: isSelected,
          onSelected: (_) {
            setState(() {
              _selectedHour = hour;
            });
          },
          selectedColor: AppColors.primary,
          backgroundColor: AppColors.background,
          side: BorderSide(
            color: isSelected
                ? AppColors.primary
                : AppColors.textSecondary.withOpacity(0.2),
          ),
          labelStyle: TextStyle(
            color: isSelected ? Colors.white : AppColors.textPrimary,
            fontWeight: FontWeight.w800,
          ),
          padding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final edadCalculada = _calcularEdad();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Agendar cita'),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/patient/dashboard'),
        ),
      ),
      body: SafeArea(
        child: _loading && _profile == null
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _loadInitialData,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const PatientHeaderCard(
                        title: 'Nueva cita',
                        subtitle:
                            'Completa la solicitud con tus datos administrativos y clínicos.',
                        icon: Icons.calendar_month_outlined,
                      ),
                      const SizedBox(height: 20),
                      PatientDataCard(
                        nombre: _fullName(),
                        documento:
                            '${_profileText('tipoDocumento')} ${_profileText('numeroDocumento')}',
                        eps: _profileText('eps'),
                        departamento: _profileText('departamento'),
                        municipio: _profileText('municipio'),
                        fechaNacimiento: _profileText('fechaNacimiento'),
                        edad: edadCalculada == null
                            ? 'No disponible'
                            : '$edadCalculada años',
                      ),
                      const SizedBox(height: 20),
                      AppointmentFormCard(
                        selectedSpecialtyId: _selectedSpecialtyId,
                        selectedAppointmentClassId:
                            _selectedAppointmentClassId,
                        selectedDate: _selectedDate,
                        specialties: _specialties,
                        appointmentClasses: _appointmentClasses,
                        inputDecoration: _inputDecoration,
                        formatDate: _formatDate,
                        pickDate: _pickDate,
                        onSpecialtyChanged: (value) {
                          setState(() {
                            _selectedSpecialtyId = value;
                          });
                        },
                        onClassChanged: (value) async {
                          setState(() {
                            _selectedAppointmentClassId = value;
                            _selectedHour = null;
                            _hours = [];
                          });

                          await _loadAvailableHours();
                        },
                        hoursSection: _buildHoursSection(),
                        edadCalculada: edadCalculada,
                        embarazada: _embarazada,
                        discapacidad: _discapacidad,
                        dolorIntenso: _dolorIntenso,
                        sangrado: _sangrado,
                        dificultadRespiratoria:
                            _dificultadRespiratoria,
                        fiebre: _fiebre,
                        onEmbarazadaChanged: (value) {
                          setState(() => _embarazada = value);
                        },
                        onDiscapacidadChanged: (value) {
                          setState(() => _discapacidad = value);
                        },
                        onDolorIntensoChanged: (value) {
                          setState(() => _dolorIntenso = value);
                        },
                        onSangradoChanged: (value) {
                          setState(() => _sangrado = value);
                        },
                        onDificultadRespiratoriaChanged: (value) {
                          setState(
                              () => _dificultadRespiratoria = value);
                        },
                        onFiebreChanged: (value) {
                          setState(() => _fiebre = value);
                        },
                        motivoController: _motivoController,
                        observacionesController:
                            _observacionesController,
                        error: _error,
                        saving: _saving,
                        onBack: () =>
                            context.go('/patient/dashboard'),
                        onSubmit: _submit,
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final Color color;
  final Color background;

  const _InfoBox({
    required this.icon,
    required this.title,
    required this.message,
    required this.color,
    required this.background,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  '',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  message,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}