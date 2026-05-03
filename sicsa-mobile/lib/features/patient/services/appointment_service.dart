import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';

class AppointmentService {
  final ApiClient _apiClient;

  AppointmentService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

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
    return response.data is List ? response.data as List<dynamic> : [];
  }

  Future<List<dynamic>> getAvailableHours({
    required String fecha,
    int? appointmentClassId,
  }) async {
    final response = await _apiClient.dio.get(
      '/appointments/available',
      queryParameters: {
        'fecha': fecha,
        if (appointmentClassId != null) 'appointmentClassId': appointmentClassId,
      },
    );

    return response.data is List ? response.data as List<dynamic> : [];
  }

  Future<void> createAppointment({
    required String fecha,
    required String hora,
    required String motivo,
    required int specialtyId,
    int? appointmentClassId,
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
        data: {
          'fecha': fecha,
          'hora': hora,
          'motivoConsulta': motivo,
          'specialtyId': specialtyId,
          if (appointmentClassId != null)
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
        },
      );
    } on DioException catch (e) {
      final data = e.response?.data;

      if (data is Map && data['message'] != null) {
        throw Exception(data['message'].toString());
      }

      throw Exception('No se pudo crear la cita');
    }
  }

  Future<void> createWaitlistAppointment({
    required String fecha,
    required String horaBase,
    required String motivo,
    required int specialtyId,
    int? appointmentClassId,
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

  Future<List<dynamic>> getMyAppointments() async {
    final response = await _apiClient.dio.get('/appointments/my');
    return response.data is List ? response.data as List<dynamic> : [];
  }

  Future<void> cancelAppointment(int id) async {
    try {
      await _apiClient.dio.post(
        '/appointments/cancel',
        data: {'id': id},
      );
    } on DioException catch (e) {
      final data = e.response?.data;

      if (data is Map && data['message'] != null) {
        throw Exception(data['message'].toString());
      }

      throw Exception('No se pudo cancelar la cita');
    }
  }
}