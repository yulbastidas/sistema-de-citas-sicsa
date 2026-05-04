import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../services/appointment_service.dart';
import '../widgets/appointment_card.dart';
import '../widgets/appointments_header_card.dart';
import '../widgets/patient_message_card.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  final AppointmentService _service = AppointmentService();

  List<dynamic> _appointments = [];
  bool _loading = true;
  bool _cancelling = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _service.getMyAppointments();

      if (!mounted) return;

      setState(() {
        _appointments = data;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _error = 'No se pudieron cargar tus citas';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _cancelAppointment(Map<String, dynamic> appointment) async {
    if (_cancelling) return;

    final id = appointment['id'];
    if (id == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancelar cita'),
        content: const Text(
          '¿Seguro que deseas cancelar esta cita? Si hay pacientes en lista de espera para esta fecha, el sistema podrá reasignar el cupo automáticamente.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sí, cancelar'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _cancelling = true);

    try {
      await _service.cancelAppointment(int.parse(id.toString()));

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.success,
          content: const Text(
            'Cita cancelada correctamente. Si había lista de espera, el cupo fue reasignado automáticamente.',
          ),
        ),
      );

      await _loadAppointments();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.error,
          content: Text(
            e.toString().replaceFirst('Exception: ', ''),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _cancelling = false);
      }
    }
  }

  int get _totalAppointments => _appointments.length;

  int get _activeAppointments {
    return _appointments.where((item) {
      final estado = (item['estado'] ?? '').toString().toLowerCase();

      return estado == 'confirmada' ||
          estado == 'aprobada' ||
          estado == 'pendiente' ||
          estado == 'lista_espera';
    }).length;
  }
  Color _statusColor(String estado) {
    switch (estado.toLowerCase()) {
      case 'confirmada':
      case 'aprobada':
        return AppColors.success;
      case 'pendiente':
      case 'pendiente_verificacion':
        return AppColors.warning;
      case 'lista_espera':
        return AppColors.secondary;
      case 'cancelada':
      case 'rechazada':
        return AppColors.error;
      case 'atendida':
        return const Color(0xFF7C3AED); // puedes dejarlo así o crear en AppColors
      default:
        return AppColors.textSecondary;
    }
  }

  String _statusLabel(String estado) {
    switch (estado.toLowerCase()) {
      case 'confirmada':
        return 'Confirmada';
      case 'aprobada':
        return 'Aprobada';
      case 'pendiente':
        return 'Pendiente';
      case 'pendiente_verificacion':
        return 'Pendiente de verificación';
      case 'lista_espera':
        return 'Lista de espera';
      case 'cancelada':
        return 'Cancelada';
      case 'rechazada':
        return 'Rechazada';
      case 'atendida':
        return 'Atendida';
      default:
        return estado;
    }
  }

  bool _canCancel(String estado) {
    final normalized = estado.toLowerCase();

    return normalized == 'confirmada' ||
        normalized == 'aprobada' ||
        normalized == 'pendiente' ||
        normalized == 'lista_espera';
  }

  String _getSpecialtyName(Map<String, dynamic> item) {
    final specialty = item['specialty'] ?? item['especialidad'];

    if (specialty is Map && specialty['nombre'] != null) {
      return specialty['nombre'].toString();
    }

    if (item['specialtyName'] != null) {
      return item['specialtyName'].toString();
    }

    if (item['especialidadNombre'] != null) {
      return item['especialidadNombre'].toString();
    }

    if (item['specialtyId'] != null) {
      return 'Especialidad #${item['specialtyId']}';
    }

    return 'Especialidad no disponible';
  }

  String _getPatientName(Map<String, dynamic> item) {
    final patient = item['patient'];

    if (patient is Map && patient['nombre'] != null) {
      return patient['nombre'].toString();
    }

    return 'Paciente';
  }

  Widget _buildAppointmentsContent() {
    if (_loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(30),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return PatientMessageCard(
        icon: Icons.error_outline,
        title: 'Error',
        message: _error!,
      );
    }

    if (_appointments.isEmpty) {
      return const PatientMessageCard(
        icon: Icons.event_busy_outlined,
        title: 'Aún no tienes citas',
        message: 'Cuando solicites una cita, aparecerá aquí.',
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _appointments.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (context, index) {
        final item = Map<String, dynamic>.from(
          _appointments[index] as Map,
        );

        final estado = (item['estado'] ?? 'pendiente').toString();
        final fecha = (item['fecha'] ?? 'Sin fecha').toString();
        final hora = (item['hora'] ?? 'Sin hora').toString();
        final motivo =
            (item['motivoConsulta'] ?? 'Sin motivo registrado').toString();

        return AppointmentCard(
          fecha: fecha,
          hora: hora,
          estado: _statusLabel(estado),
          estadoColor: _statusColor(estado),
          especialidad: _getSpecialtyName(item),
          paciente: _getPatientName(item),
          motivo: motivo,
          canCancel: _canCancel(estado) && !_cancelling,
          onCancel: () => _cancelAppointment(item),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background, // ✅
      appBar: AppBar(
        title: const Text('Mis citas'),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary, // ✅
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/patient/dashboard'),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadAppointments,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppointmentsHeaderCard(
                total: _totalAppointments,
                activas: _activeAppointments,
              ),
              const SizedBox(height: 22),
              const Text(
                'Historial de citas',
                style: TextStyle(
                  color: AppColors.textPrimary, 
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 12),
              _buildAppointmentsContent(),
            ],
          ),
        ),
      ),
    );
  }
}