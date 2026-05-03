import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage_service.dart';
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
        throw EmailNotVerifiedException(model.email.trim());
      }

      final token = data['access_token'] ?? data['accessToken'] ?? data['token'];

      if (token == null || token.toString().isEmpty) {
        throw Exception('No se recibió token del servidor');
      }

      await _storageService.saveToken(token.toString());
    } on EmailNotVerifiedException {
      rethrow;
    } on DioException catch (e) {
      final data = e.response?.data;

      if (data is Map && data['message'] != null) {
        throw Exception(data['message'].toString());
      }

      if (e.response?.statusCode == 401) {
        throw Exception('Correo o contraseña incorrectos');
      }

      throw Exception('Error al conectar con el servidor');
    } catch (e) {
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> logout() async {
    await _storageService.deleteToken();
  }
}