import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../../../core/utils/error_handler.dart';

class AppointmentService {
  final ApiClient _apiClient;

  AppointmentService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  static Map<String, dynamic> availabilityQuery({
    required String fecha,
    required int specialtyId,
  }) =>
      {'fecha': fecha, 'specialtyId': specialtyId};

  static Map<String, dynamic> buildCreatePayload({
    required String fecha,
    required String hora,
    required String motivo,
    required int specialtyId,
    required int appointmentClassId,
    String? observaciones,
    int? edad,
    bool embarazada = false,
    bool discapacidad = false,
    bool dolorIntenso = false,
    bool sangrado = false,
    bool dificultadRespiratoria = false,
    bool fiebre = false,
  }) =>
      {
        'fecha': fecha,
        'hora': hora,
        'motivoConsulta': motivo,
        'specialtyId': specialtyId,
        'appointmentClassId': appointmentClassId,
        if (observaciones != null && observaciones.trim().isNotEmpty)
          'observaciones': observaciones.trim(),
        if (edad != null) 'edad': edad,
        'embarazada': embarazada,
        'discapacidad': discapacidad,
        'dolorIntenso': dolorIntenso,
        'sangrado': sangrado,
        'dificultadRespiratoria': dificultadRespiratoria,
        'fiebre': fiebre,
      };

  Future<Map<String, dynamic>> getMyProfile() async {
    final response = await _apiClient.dio.get('/patients/me');
    return Map<String, dynamic>.from(response.data);
  }

  Future<List<dynamic>> getSpecialties() async {
    final response = await _apiClient.dio.get('/specialties');
    return response.data is List ? response.data as List<dynamic> : [];
  }

  Future<List<dynamic>> getAppointmentClasses() async {
    final response = await _apiClient.dio.get('/appointment-class');
    final items =
        response.data is List ? response.data as List<dynamic> : <dynamic>[];
    return items.where((item) {
      if (item is! Map) {
        return true;
      }
      final name = (item['nombre'] ?? '').toString().toLowerCase().trim();
      return name != 'lectura de resultados';
    }).toList();
  }

  Future<List<dynamic>> getAvailableHours({
    required String fecha,
    required int specialtyId,
  }) async {
    final response = await _apiClient.dio.get(
      '/appointments/available',
      queryParameters:
          availabilityQuery(fecha: fecha, specialtyId: specialtyId),
    );

    return response.data is List ? response.data as List<dynamic> : [];
  }

  Future<void> createAppointment({
    required String fecha,
    required String hora,
    required String motivo,
    required int specialtyId,
    required int appointmentClassId,
    String? observaciones,
    int? edad,
    bool embarazada = false,
    bool discapacidad = false,
    bool dolorIntenso = false,
    bool sangrado = false,
    bool dificultadRespiratoria = false,
    bool fiebre = false,
  }) async {
    try {
      await _apiClient.dio.post(
        '/appointments',
        data: buildCreatePayload(
          fecha: fecha,
          hora: hora,
          motivo: motivo,
          specialtyId: specialtyId,
          appointmentClassId: appointmentClassId,
          observaciones: observaciones,
          edad: edad,
          embarazada: embarazada,
          discapacidad: discapacidad,
          dolorIntenso: dolorIntenso,
          sangrado: sangrado,
          dificultadRespiratoria: dificultadRespiratoria,
          fiebre: fiebre,
        ),
      );
    } on DioException catch (e) {
      throw Exception(ErrorHandler.getErrorMessage(e));
    }
  }

  Future<void> createWaitlistAppointment({
    required String fecha,
    required String horaBase,
    required String motivo,
    required int specialtyId,
    required int appointmentClassId,
    String? observaciones,
    int? edad,
    bool embarazada = false,
    bool discapacidad = false,
    bool dolorIntenso = false,
    bool sangrado = false,
    bool dificultadRespiratoria = false,
    bool fiebre = false,
  }) async {
    await createAppointment(
      fecha: fecha,
      hora: horaBase,
      motivo: motivo,
      specialtyId: specialtyId,
      appointmentClassId: appointmentClassId,
      observaciones: observaciones,
      edad: edad,
      embarazada: embarazada,
      discapacidad: discapacidad,
      dolorIntenso: dolorIntenso,
      sangrado: sangrado,
      dificultadRespiratoria: dificultadRespiratoria,
      fiebre: fiebre,
    );
  }

  Future<List<dynamic>> getMyAppointments(
      {int page = 1, int limit = 100}) async {
    final response = await _apiClient.dio.get('/appointments/my',
        queryParameters: {'page': page, 'limit': limit});
    final payload = response.data;
    if (payload is List) {
      return payload;
    }
    if (payload is Map && payload['data'] is List) {
      return payload['data'] as List<dynamic>;
    }
    return [];
  }

  Future<void> cancelAppointment(int id) async {
    try {
      await _apiClient.dio.post(
        '/appointments/cancel',
        data: {'id': id},
      );
    } on DioException catch (e) {
      throw Exception(ErrorHandler.getErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> updateMyProfile(
      Map<String, dynamic> changes) async {
    try {
      final response =
          await _apiClient.dio.patch('/patients/me', data: changes);
      final payload = response.data;
      if (payload is Map && payload['patient'] is Map) {
        return Map<String, dynamic>.from(payload['patient'] as Map);
      }
      return Map<String, dynamic>.from(payload as Map);
    } on DioException catch (error) {
      throw Exception(ErrorHandler.getErrorMessage(error));
    }
  }
}
