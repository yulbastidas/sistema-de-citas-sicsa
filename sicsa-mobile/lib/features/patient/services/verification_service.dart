import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../../../core/utils/error_handler.dart';

class VerificationService {
  final ApiClient _apiClient;

  VerificationService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<Map<String, dynamic>?> getMyVerification() async {
    try {
      final response = await _apiClient.dio.get('/verifications/me');

      if (response.data == null) return null;

      return Map<String, dynamic>.from(response.data);
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) return null;
      throw Exception(ErrorHandler.getErrorMessage(error));
    }
  }

  Future<Map<String, dynamic>> getMyProfile() async {
    final response = await _apiClient.dio.get('/patients/me');
    return Map<String, dynamic>.from(response.data);
  }

  Future<void> requestVerification() async {
    final profile = await getMyProfile();

    final documento = profile['numeroDocumento']?.toString();
    final eps = profile['eps']?.toString();

    if (documento == null || documento.isEmpty) {
      throw Exception('Tu perfil no tiene número de documento');
    }

    if (eps == null || eps.isEmpty) {
      throw Exception('Tu perfil no tiene EPS registrada');
    }

    try {
      await _apiClient.dio.post('/verifications/request',
          data: {'documento': documento, 'eps': eps});
    } on DioException catch (error) {
      throw Exception(ErrorHandler.getErrorMessage(error));
    }
  }

  Future<void> expireMyVerification() async {
    await _apiClient.dio.post('/verifications/expire-my');
  }
}
