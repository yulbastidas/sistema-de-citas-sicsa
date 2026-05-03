import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;

import '../models/register_models.dart';
import '../services/register_service.dart';
import '../widgets/birth_date_field.dart';
import '../widgets/register_header.dart';
import '../widgets/register_input_decoration.dart';
import '../widgets/register_text_field.dart';
import '../../../core/theme/app_colors.dart';

class PatientProfileScreen extends StatefulWidget {
  final RegisterCredentials credentials;

  const PatientProfileScreen({
    super.key,
    required this.credentials,
  });

  @override
  State<PatientProfileScreen> createState() => _PatientProfileScreenState();
}

class _PatientProfileScreenState extends State<PatientProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final RegisterService _service = RegisterService();

  final _numeroDocumentoController = TextEditingController();
  final _primerNombreController = TextEditingController();
  final _segundoNombreController = TextEditingController();
  final _primerApellidoController = TextEditingController();
  final _segundoApellidoController = TextEditingController();
  final _telefonoController = TextEditingController();

  final List<String> _tiposDocumento = [
    'CC',
    'TI',
    'CE',
    'RC',
    'PASAPORTE',
  ];

  final List<String> _generos = [
    'Femenino',
    'Masculino',
    'Otro',
    'Prefiero no decirlo',
  ];

  String? _tipoDocumento;
  String? _genero;
  DateTime? _fechaNacimiento;
  String? _departamento;
  String? _municipio;
  String? _eps;
  int? _epsId;

  List<String> _departamentos = [];
  List<String> _municipios = [];
  List<EpsItem> _epsList = [];

  bool _loading = false;
  bool _loadingMunicipios = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  @override
  void dispose() {
    _numeroDocumentoController.dispose();
    _primerNombreController.dispose();
    _segundoNombreController.dispose();
    _primerApellidoController.dispose();
    _segundoApellidoController.dispose();
    _telefonoController.dispose();
    super.dispose();
  }

  Future<void> _fetchInitialData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    await Future.wait([
      _fetchDepartamentos(),
      _fetchEps(),
    ]);

    if (mounted) {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchDepartamentos() async {
    try {
      final uri = Uri.parse(
        'https://www.datos.gov.co/resource/gt2j-8ykr.json?\$limit=5000',
      );

      final response = await http.get(uri);

      if (response.statusCode != 200) {
        throw Exception('Error ${response.statusCode}');
      }

      final data = json.decode(response.body) as List<dynamic>;

      final departamentos = data
          .map((item) => item['departamento_nom'])
          .whereType<String>()
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .toSet()
          .toList()
        ..sort();

      if (!mounted) return;

      setState(() {
        _departamentos = departamentos;
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _departamentos = [];
        _error = 'No se pudieron cargar los departamentos';
      });
    }
  }

  Future<void> _fetchMunicipios(String departamento) async {
    setState(() {
      _loadingMunicipios = true;
      _error = null;
      _municipio = null;
      _municipios = [];
    });

    try {
      final uri = Uri.parse(
        'https://www.datos.gov.co/resource/gt2j-8ykr.json'
        '?departamento_nom=${Uri.encodeComponent(departamento)}'
        '&\$limit=5000',
      );

      final response = await http.get(uri);

      if (response.statusCode != 200) {
        throw Exception('Error ${response.statusCode}');
      }

      final data = json.decode(response.body) as List<dynamic>;

      final municipios = data
          .map((item) => item['ciudad_municipio_nom'])
          .whereType<String>()
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .toSet()
          .toList()
        ..sort();

      if (!mounted) return;

      setState(() {
        _municipios = municipios;
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _municipios = [];
        _error = 'No se pudieron cargar los municipios';
      });
    } finally {
      if (mounted) {
        setState(() => _loadingMunicipios = false);
      }
    }
  }

  Future<void> _fetchEps() async {
    try {
      final epsList = await _service.fetchEpsList();

      if (!mounted) return;

      setState(() {
        _epsList = epsList;
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _epsList = [];
        _error = 'No se pudo cargar la lista de EPS';
      });
    }
  }

  EpsItem? get _selectedEps {
    if (_epsId == null) return null;

    for (final eps in _epsList) {
      if (eps.id == _epsId) return eps;
    }

    return null;
  }

  int? _calculateAge(DateTime? birthDate) {
    if (birthDate == null) return null;

    final today = DateTime.now();
    var age = today.year - birthDate.year;

    if (today.month < birthDate.month ||
        (today.month == birthDate.month && today.day < birthDate.day)) {
      age--;
    }

    return age;
  }

  bool _isValidBirthDate(DateTime birthDate) {
    final today = DateTime.now();

    final onlyToday = DateTime(today.year, today.month, today.day);
    final onlyBirthDate = DateTime(
      birthDate.year,
      birthDate.month,
      birthDate.day,
    );

    if (onlyBirthDate.isAfter(onlyToday)) return false;

    final age = _calculateAge(birthDate);

    if (age == null) return false;

    return age >= 0 && age <= 120;
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();

    final selectedDate = await showDatePicker(
      context: context,
      initialDate: _fechaNacimiento ?? DateTime(now.year - 18, now.month, now.day),
      firstDate: DateTime(1900),
      lastDate: now,
    );

    if (selectedDate == null) return;

    if (!_isValidBirthDate(selectedDate)) {
      setState(() {
        _error = 'Ingresa una fecha de nacimiento válida';
      });
      return;
    }

    setState(() {
      _fechaNacimiento = selectedDate;
      _error = null;
    });
  }

  Future<void> _submit() async {
    final isValid = _formKey.currentState?.validate() ?? false;

    if (!isValid) return;

    if (_fechaNacimiento == null) {
      setState(() {
        _error = 'Selecciona la fecha de nacimiento';
      });
      return;
    }

    if (!_isValidBirthDate(_fechaNacimiento!)) {
      setState(() {
        _error = 'La fecha de nacimiento no puede ser futura';
      });
      return;
    }

    if (_departamento == null || _municipio == null || _eps == null) {
      setState(() {
        _error = 'Completa departamento, municipio y EPS';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final profile = PatientProfile(
      tipoDocumento: _tipoDocumento!,
      numeroDocumento: _numeroDocumentoController.text.trim(),
      primerNombre: _primerNombreController.text.trim(),
      segundoNombre: _segundoNombreController.text.trim().isEmpty
          ? null
          : _segundoNombreController.text.trim(),
      primerApellido: _primerApellidoController.text.trim(),
      segundoApellido: _segundoApellidoController.text.trim().isEmpty
          ? null
          : _segundoApellidoController.text.trim(),
      telefono: _telefonoController.text.trim(),
      genero: _genero,
      fechaNacimiento: _fechaNacimiento?.toIso8601String().split('T').first,
      departamento: _departamento!,
      municipio: _municipio!,
      eps: _eps!,
      epsId: _epsId,
    );

    try {
      final email = await _service.registerPatient(
        credentials: widget.credentials,
        profile: profile,
      );

      if (!mounted) return;

      context.go('/verify-email', extra: email);
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  String? _requiredValidator(String? value) {
    return value == null || value.trim().isEmpty ? 'Campo requerido' : null;
  }

  String? _documentValidator(String? value) {
    final text = value?.trim() ?? '';

    if (text.isEmpty) return 'Campo requerido';

    if (!RegExp(r'^\d{5,15}$').hasMatch(text)) {
      return 'Documento inválido';
    }

    return null;
  }

  String? _phoneValidator(String? value) {
    final text = value?.trim() ?? '';

    if (text.isEmpty) return 'Campo requerido';

    if (!RegExp(r'^\d{7,15}$').hasMatch(text)) {
      return 'Teléfono inválido';
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    final age = _calculateAge(_fechaNacimiento);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Completar perfil'),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.go('/register'),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Card(
            elevation: 6,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(32),
            ),
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const RegisterHeader(),
                    const SizedBox(height: 24),

                    DropdownButtonFormField<String>(
                      value: _tipoDocumento,
                      isExpanded: true,
                      items: _tiposDocumento
                          .map(
                            (tipo) => DropdownMenuItem<String>(
                              value: tipo,
                              child: Text(tipo),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          _tipoDocumento = value;
                        });
                      },
                      decoration: registerInputDecoration(
                        label: 'Tipo de documento',
                        icon: Icons.badge_outlined,
                      ),
                      validator: (value) => value == null || value.isEmpty
                          ? 'Seleccione un tipo de documento'
                          : null,
                    ),

                    const SizedBox(height: 16),

                    RegisterTextField(
                      controller: _numeroDocumentoController,
                      label: 'Número de documento',
                      icon: Icons.numbers,
                      keyboardType: TextInputType.number,
                      validator: _documentValidator,
                    ),

                    const SizedBox(height: 16),

                    RegisterTextField(
                      controller: _primerNombreController,
                      label: 'Primer nombre',
                      icon: Icons.person_outline,
                      validator: _requiredValidator,
                    ),

                    const SizedBox(height: 16),

                    RegisterTextField(
                      controller: _segundoNombreController,
                      label: 'Segundo nombre (opcional)',
                      icon: Icons.person_outline,
                    ),

                    const SizedBox(height: 16),

                    RegisterTextField(
                      controller: _primerApellidoController,
                      label: 'Primer apellido',
                      icon: Icons.person_outline,
                      validator: _requiredValidator,
                    ),

                    const SizedBox(height: 16),

                    RegisterTextField(
                      controller: _segundoApellidoController,
                      label: 'Segundo apellido (opcional)',
                      icon: Icons.person_outline,
                    ),

                    const SizedBox(height: 16),

                    RegisterTextField(
                      controller: _telefonoController,
                      label: 'Teléfono',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      validator: _phoneValidator,
                    ),

                    const SizedBox(height: 16),

                    DropdownButtonFormField<String>(
                      value: _genero,
                      isExpanded: true,
                      items: _generos
                          .map(
                            (genero) => DropdownMenuItem<String>(
                              value: genero,
                              child: Text(genero),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          _genero = value;
                        });
                      },
                      decoration: registerInputDecoration(
                        label: 'Género (opcional)',
                        icon: Icons.transgender,
                      ),
                    ),

                    const SizedBox(height: 16),

                    BirthDateField(
                      fechaNacimiento: _fechaNacimiento,
                      age: age,
                      onTap: _pickBirthDate,
                    ),

                    const SizedBox(height: 16),

                    DropdownButtonFormField<String>(
                      value: _departamento,
                      isExpanded: true,
                      items: _departamentos
                          .map(
                            (departamento) => DropdownMenuItem<String>(
                              value: departamento,
                              child: Text(departamento),
                            ),
                          )
                          .toList(),
                      onChanged: _loading
                          ? null
                          : (value) {
                              setState(() {
                                _departamento = value;
                                _municipio = null;
                                _municipios = [];
                              });

                              if (value != null) {
                                _fetchMunicipios(value);
                              }
                            },
                      decoration: registerInputDecoration(
                        label: 'Departamento',
                        icon: Icons.map_outlined,
                      ),
                      validator: (value) => value == null || value.isEmpty
                          ? 'Seleccione un departamento'
                          : null,
                    ),

                    const SizedBox(height: 16),

                    DropdownButtonFormField<String>(
                      value: _municipio,
                      isExpanded: true,
                      items: _municipios
                          .map(
                            (municipio) => DropdownMenuItem<String>(
                              value: municipio,
                              child: Text(municipio),
                            ),
                          )
                          .toList(),
                      onChanged: _departamento == null || _loadingMunicipios
                          ? null
                          : (value) {
                              setState(() {
                                _municipio = value;
                              });
                            },
                      decoration: registerInputDecoration(
                        label: _loadingMunicipios
                            ? 'Cargando municipios...'
                            : 'Municipio',
                        icon: Icons.location_city_outlined,
                      ),
                      validator: (value) => value == null || value.isEmpty
                          ? 'Seleccione un municipio'
                          : null,
                    ),

                    const SizedBox(height: 16),

                    DropdownButtonFormField<EpsItem>(
                      value: _selectedEps,
                      isExpanded: true,
                      items: _epsList
                          .map(
                            (eps) => DropdownMenuItem<EpsItem>(
                              value: eps,
                              child: Text(eps.nombre),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        if (value == null) return;

                        setState(() {
                          _eps = value.nombre;
                          _epsId = value.id;
                        });
                      },
                      decoration: registerInputDecoration(
                        label: 'EPS',
                        icon: Icons.local_hospital_outlined,
                      ),
                      validator: (value) =>
                          value == null ? 'Seleccione una EPS' : null,
                    ),

                    const SizedBox(height: 24),

                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                         ),
                    child: Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                        color: AppColors.error,
                        fontWeight: FontWeight.w600,
                     ),
                     ),
                    ),
                    const SizedBox(height: 16),
                    ],

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _loading ? null : _submit,
                        icon: _loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.mark_email_read_outlined),
                        label: Text(
                          _loading ? 'Registrando...' : 'Registrar y verificar',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}