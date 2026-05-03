import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/services/auth_service.dart';
import '../services/verification_service.dart';
import '../widgets/dashboard_option.dart';
import '../widgets/patient_header_card.dart';

class PatientDashboardScreen extends StatefulWidget {
  const PatientDashboardScreen({super.key});

  @override
  State<PatientDashboardScreen> createState() =>
      _PatientDashboardScreenState();
}

class _PatientDashboardScreenState
    extends State<PatientDashboardScreen> {
  final VerificationService _verificationService =
      VerificationService();

  bool _loading = true;
  bool _requesting = false;
  bool _loggingOut = false;
  String? _error;
  Map<String, dynamic>? _verification;

  @override
  void initState() {
    super.initState();
    _loadVerification();
  }

  Future<void> _loadVerification() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final data = await _verificationService.getMyVerification();

    if (!mounted) return;

    setState(() {
      _verification = data;
      _loading = false;
    });
  }

  String get _verificationStatus {
    final estado =
        _verification?['estado']?.toString().toLowerCase();

    if (estado == null || estado.isEmpty) {
      return 'sin_verificacion';
    }

    return estado;
  }

  bool get _isApproved {
    return _verificationStatus == 'aprobada' ||
        _verificationStatus == 'aprobado' ||
        _verificationStatus == 'approved';
  }

  Future<void> _requestVerification() async {
    setState(() {
      _requesting = true;
      _error = null;
    });

    try {
      await _verificationService.requestVerification();
      await _loadVerification();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.success,
          content: const Text(
            'Solicitud enviada correctamente',
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error =
            error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _requesting = false);
      }
    }
  }

  Future<void> _logout(BuildContext context) async {
    setState(() => _loggingOut = true);

    try {
      await _verificationService.expireMyVerification();
    } catch (_) {}

    await AuthService().logout();

    if (!context.mounted) return;

    context.go('/login');
  }

  Color _statusColor() {
    switch (_verificationStatus) {
      case 'aprobada':
      case 'aprobado':
      case 'approved':
        return AppColors.success;
      case 'pendiente':
      case 'pending':
        return AppColors.warning;
      case 'rechazada':
      case 'rechazado':
      case 'rejected':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _statusText() {
    switch (_verificationStatus) {
      case 'aprobada':
      case 'aprobado':
      case 'approved':
        return 'Verificación aprobada';
      case 'pendiente':
      case 'pending':
        return 'Verificación pendiente';
      case 'rechazada':
      case 'rechazado':
      case 'rejected':
        return 'Verificación rechazada';
      default:
        return 'Sin verificación';
    }
  }

  String _statusDescription() {
    switch (_verificationStatus) {
      case 'aprobada':
      case 'aprobado':
      case 'approved':
        return 'Ya puedes agendar citas médicas.';
      case 'pendiente':
      case 'pending':
        return 'Tu solicitud está en revisión.';
      case 'rechazada':
      case 'rechazado':
      case 'rejected':
        return 'Debes solicitar una nueva verificación.';
      default:
        return 'Solicita verificación para agendar citas.';
    }
  }

  Widget _buildVerificationCard() {
    if (_loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppColors.textSecondary.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.verified_user_outlined,
                color: _statusColor(),
                size: 32,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _statusText(),
                  style: TextStyle(
                    color: _statusColor(),
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _statusDescription(),
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
          if (!_isApproved) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed:
                    _requesting ? null : _requestVerification,
                icon: _requesting
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
                  _requesting
                      ? 'Enviando...'
                      : 'Solicitar verificación',
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMainOptions() {
    return Column(
      children: [
        DashboardOption(
          icon: Icons.calendar_month_outlined,
          title: 'Agendar cita',
          subtitle: _isApproved
              ? 'Solicita una nueva cita médica.'
              : 'Bloqueado hasta aprobación.',
          color: _isApproved
              ? AppColors.secondary
              : AppColors.textSecondary,
          enabled: _isApproved,
          onTap: () =>
              context.go('/patient/create-appointment'),
        ),
        const SizedBox(height: 14),
        DashboardOption(
          icon: Icons.assignment_outlined,
          title: 'Mis citas',
          subtitle: 'Consulta tus citas.',
          color: AppColors.primary,
          enabled: true,
          onTap: () =>
              context.go('/patient/appointments'),
        ),
        const SizedBox(height: 14),
        DashboardOption(
          icon: Icons.person_outline,
          title: 'Mi perfil',
          subtitle: 'Revisa tus datos.',
          color: AppColors.secondary,
          enabled: true,
          onTap: () => context.go('/patient/profile'),
        ),
        const SizedBox(height: 14),
        DashboardOption(
          icon: Icons.logout,
          title: 'Cerrar sesión',
          subtitle:
              _loggingOut ? 'Cerrando...' : 'Salir del sistema',
          color: AppColors.error,
          enabled: !_loggingOut,
          onTap: () => _logout(context),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('SICSA Paciente'),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadVerification,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const PatientHeaderCard(
                  title: 'Bienvenido al portal del paciente',
                  subtitle:
                      'Gestiona tus citas médicas desde SICSA.',
                  icon: Icons.favorite_border,
                ),

                const SizedBox(height: 24),

                _buildVerificationCard(),

                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color:
                          AppColors.error.withOpacity(0.08),
                      borderRadius:
                          BorderRadius.circular(12),
                    ),
                    child: Text(
                      _error!,
                      style: const TextStyle(
                        color: AppColors.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 28),

                const Text(
                  'Opciones principales',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),

                const SizedBox(height: 16),

                _buildMainOptions(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}