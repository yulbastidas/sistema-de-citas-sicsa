class RegisterCredentials {
  final String email;
  final String password;

  RegisterCredentials({
    required this.email,
    required this.password,
  });
}

class PatientProfile {
  final String tipoDocumento;
  final String numeroDocumento;
  final String primerNombre;
  final String? segundoNombre;
  final String primerApellido;
  final String? segundoApellido;
  final String telefono;
  final String? genero;
  final String? fechaNacimiento;
  final String departamento;
  final String municipio;
  final String eps;
  final int? epsId;

  PatientProfile({
    required this.tipoDocumento,
    required this.numeroDocumento,
    required this.primerNombre,
    this.segundoNombre,
    required this.primerApellido,
    this.segundoApellido,
    required this.telefono,
    this.genero,
    this.fechaNacimiento,
    required this.departamento,
    required this.municipio,
    required this.eps,
    this.epsId,
  });

  Map<String, dynamic> toJson({required RegisterCredentials credentials}) {
    return {
      'email': credentials.email,
      'password': credentials.password,
      'tipoDocumento': tipoDocumento,
      'numeroDocumento': numeroDocumento,
      'primerNombre': primerNombre,
      'segundoNombre': segundoNombre,
      'primerApellido': primerApellido,
      'segundoApellido': segundoApellido,
      'telefono': telefono,
      'genero': genero,
      'fechaNacimiento': fechaNacimiento,
      'departamento': departamento,
      'municipio': municipio,
      'eps': eps,
      'epsId': epsId,
    };
  }
}

class EpsItem {
  final int id;
  final String nombre;

  EpsItem({
    required this.id,
    required this.nombre,
  });

  factory EpsItem.fromJson(Map<String, dynamic> json) {
    return EpsItem(
      id: NumberParser.toInt(json['id']),
      nombre: (json['nombre'] ?? '').toString(),
    );
  }
}

class NumberParser {
  static int toInt(dynamic value) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}