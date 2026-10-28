import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../services/appointment_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, this.service});

  final AppointmentService? service;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final AppointmentService _service;

  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _profile;

  @override
  void initState() {
    super.initState();
    _service = widget.service ?? AppointmentService();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final response = await _service.getMyProfile();

      if (!mounted) return;

      setState(() {
        _profile = response;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = 'Error cargando perfil';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _editProfile() async {
    final phone = TextEditingController(
        text: _value('telefono') == 'No registrado' ? '' : _value('telefono'));
    final department = TextEditingController(
        text: _value('departamento') == 'No registrado'
            ? ''
            : _value('departamento'));
    final city = TextEditingController(
        text:
            _value('municipio') == 'No registrado' ? '' : _value('municipio'));
    final address = TextEditingController(
        text:
            _value('direccion') == 'No registrado' ? '' : _value('direccion'));
    final accepted = await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
              title: const Text('Editar información permitida'),
              content: SingleChildScrollView(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                TextField(
                    controller: phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'Celular')),
                const SizedBox(height: 12),
                TextField(
                    controller: department,
                    decoration:
                        const InputDecoration(labelText: 'Departamento')),
                const SizedBox(height: 12),
                TextField(
                    controller: city,
                    decoration: const InputDecoration(labelText: 'Municipio')),
                const SizedBox(height: 12),
                TextField(
                    controller: address,
                    decoration: const InputDecoration(labelText: 'Dirección')),
              ])),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(dialogContext, false),
                    child: const Text('Cancelar')),
                ElevatedButton(
                    onPressed: () => Navigator.pop(dialogContext, true),
                    child: const Text('Guardar'))
              ],
            ));
    if (accepted != true || !mounted) return;
    final normalizedPhone = phone.text.replaceAll(RegExp(r'\D'), '');
    if (!RegExp(r'^3\d{9}$').hasMatch(normalizedPhone)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Ingresa un celular colombiano válido')));
      return;
    }
    try {
      final updated = await _service.updateMyProfile({
        'telefono': normalizedPhone,
        'departamento': department.text.trim(),
        'municipio': city.text.trim(),
        'direccion': address.text.trim()
      });
      if (!mounted) return;
      setState(() => _profile = updated);
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Perfil actualizado correctamente')));
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(error.toString().replaceFirst('Exception: ', ''))));
      }
    }
  }

  String _value(String key) {
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

  Widget _item({
    required String label,
    required String value,
    required IconData icon,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: AppColors.textSecondary.withOpacity(0.12),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 38,
            width: 38,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              icon,
              size: 20,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.error.withOpacity(0.08),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Text(
            _error!,
            style: const TextStyle(
              color: AppColors.error,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );
    }

    if (_profile == null) {
      return const Center(child: Text('Sin datos'));
    }

    return RefreshIndicator(
      onRefresh: _loadProfile,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    AppColors.primary,
                    AppColors.secondary,
                  ],
                ),
                borderRadius: BorderRadius.circular(28),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1A000000),
                    blurRadius: 18,
                    offset: Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    height: 76,
                    width: 76,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.25),
                      ),
                    ),
                    child: const Icon(
                      Icons.person_outline,
                      color: Colors.white,
                      size: 42,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _fullName(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Perfil del paciente',
                    style: TextStyle(
                      color: Color(0xFFE0F2FE),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: AppColors.textSecondary.withOpacity(0.12),
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0F000000),
                    blurRadius: 16,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  _item(
                    label: 'Documento',
                    value:
                        '${_value('tipoDocumento')} ${_value('numeroDocumento')}',
                    icon: Icons.badge_outlined,
                  ),
                  _item(
                    label: 'Correo electrónico',
                    value: _value('email'),
                    icon: Icons.email_outlined,
                  ),
                  _item(
                    label: 'Teléfono',
                    value: _value('telefono'),
                    icon: Icons.phone_outlined,
                  ),
                  _item(
                    label: 'EPS',
                    value: _value('eps'),
                    icon: Icons.local_hospital_outlined,
                  ),
                  _item(
                    label: 'Departamento',
                    value: _value('departamento'),
                    icon: Icons.map_outlined,
                  ),
                  _item(
                    label: 'Municipio',
                    value: _value('municipio'),
                    icon: Icons.location_city_outlined,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _editProfile,
                icon: const Icon(Icons.edit_outlined),
                label: const Text('Editar información permitida'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => context.go('/patient/dashboard'),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Volver al dashboard'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: BorderSide(
                    color: AppColors.primary.withOpacity(0.35),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mi perfil'),
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
        child: _buildContent(),
      ),
    );
  }
}
