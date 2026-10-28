import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../core/auth/session_service.dart';
import '../../../core/utils/error_handler.dart';
import '../models/login_model.dart';

class EmailNotVerifiedException implements Exception {
  final String email;

  EmailNotVerifiedException(this.email);

  @override
  String toString() {
    return 'Debes verificar tu correo antes de iniciar sesión';
  }
}

class AuthService {
  final ApiClient _apiClient;
  final SecureStorageService _storageService;

  AuthService({
    ApiClient? apiClient,
    SecureStorageService? storageService,
  })  : _apiClient = apiClient ?? ApiClient(),
        _storageService = storageService ?? SecureStorageService();

  Future<void> login(LoginModel model) async {
    try {
      final response = await _apiClient.dio.post(
        '/auth/login',
        data: model.toJson(),
      );

      final data = response.data;

      if (data is! Map<String, dynamic>) {
        throw Exception('Respuesta inválida del servidor');
      }

      final user = data['user'];

      if (user is Map && user['emailVerified'] == false) {
        await _storageService.deleteToken();
        throw EmailNotVerifiedException(model.identifier.trim());
      }

      final token =
          data['access_token'] ?? data['accessToken'] ?? data['token'];

      if (token == null || token.toString().isEmpty) {
        throw Exception('No se recibió token del servidor');
      }

      final session =
          SessionService(storage: _storageService).parseToken(token.toString());
      if (session == null || session.isExpired || !session.isPatient) {
        await _storageService.deleteToken();
        throw Exception('Esta aplicación móvil es exclusiva para pacientes');
      }

      await _storageService.saveToken(token.toString());
    } on EmailNotVerifiedException {
      rethrow;
    } on DioException catch (e) {
      throw Exception(ErrorHandler.getErrorMessage(e));
    } catch (e) {
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> requestEmailReset(String email) async {
    await _post('/auth/forgot-password', {'email': email.trim().toLowerCase()});
  }

  Future<void> verifyEmailReset(String email, String code) async {
    await _post('/auth/verify-reset-code', {
      'email': email.trim().toLowerCase(),
      'code': code.trim(),
    });
  }

  Future<void> resetEmailPassword({
    required String email,
    required String code,
    required String password,
  }) async {
    await _post('/auth/reset-password', {
      'email': email.trim().toLowerCase(),
      'code': code.trim(),
      'newPassword': password,
      'confirmPassword': password,
    });
  }

  Future<Map<String, dynamic>> requestPhoneReset(String phone) async =>
      _post('/auth/forgot-password/phone', {'phone': phone.trim()});

  Future<Map<String, dynamic>> verifyPhoneReset({
    required String phone,
    required String challengeId,
    required String code,
  }) async =>
      _post('/auth/verify-reset-code/phone', {
        'phone': phone.trim(),
        'challengeId': challengeId,
        'code': code.trim(),
      });

  Future<void> resetPhonePassword({
    required String phone,
    required String resetToken,
    required String password,
  }) async {
    await _post('/auth/reset-password/phone', {
      'phone': phone.trim(),
      'resetToken': resetToken,
      'newPassword': password,
      'confirmPassword': password,
    });
  }

  Future<Map<String, dynamic>> _post(
      String path, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post(path, data: data);
      return response.data is Map
          ? Map<String, dynamic>.from(response.data as Map)
          : <String, dynamic>{};
    } on DioException catch (error) {
      throw Exception(ErrorHandler.getErrorMessage(error));
    }
  }

  Future<void> logout() async {
    await _storageService.deleteToken();
  }
}
