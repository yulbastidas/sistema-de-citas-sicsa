import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../models/register_models.dart';

class RegisterService {
  final ApiClient _apiClient;

  RegisterService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<List<EpsItem>> fetchEpsList() async {
    final response = await _apiClient.dio.get('/eps');
    final data = response.data;

    if (data is List) {
      return data
          .map((item) => EpsItem.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    throw Exception('Error al cargar EPS');
  }

  Future<String> registerPatient({
    required RegisterCredentials credentials,
    required PatientProfile profile,
  }) async {
    try {
      final data = profile.toJson(credentials: credentials);

      final response = await _apiClient.dio.post(
        '/auth/register',
        data: data,
      );

      final responseData = response.data;

      if (responseData is Map && responseData['email'] != null) {
        return responseData['email'].toString();
      }

      return credentials.email.trim();
    } on DioException catch (e) {
      final data = e.response?.data;

      if (data is Map && data['message'] != null) {
        throw Exception(data['message'].toString());
      }

      throw Exception('Error al registrar paciente');
    }
  }

  Future<void> sendVerificationCode(String email) async {
    try {
      await _apiClient.dio.post(
        '/auth/send-verification-code',
        data: {
          'email': email.trim(),
        },
      );
    } on DioException catch (e) {
      final data = e.response?.data;

      if (data is Map && data['message'] != null) {
        throw Exception(data['message'].toString());
      }

      throw Exception('No se pudo reenviar el código');
    }
  }

  Future<void> verifyEmailCode({
    required String email,
    required String code,
  }) async {
    try {
      await _apiClient.dio.post(
        '/auth/verify-email-code',
        data: {
          'email': email.trim(),
          'code': code.trim(),
        },
      );
    } on DioException catch (e) {
      final data = e.response?.data;

      if (data is Map && data['message'] != null) {
        throw Exception(data['message'].toString());
      }

      throw Exception('No se pudo verificar el correo');
    }
  }
}