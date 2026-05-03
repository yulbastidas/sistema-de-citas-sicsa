import '../../../core/network/api_client.dart';

class VerificationService {
  final ApiClient _apiClient;

  VerificationService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  Future<Map<String, dynamic>?> getMyVerification() async {
    try {
      final response = await _apiClient.dio.get('/verifications/me');

      if (response.data == null) return null;

      return Map<String, dynamic>.from(response.data);
    } catch (_) {
      return null;
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

    await _apiClient.dio.post(
      '/verifications/request',
      data: {
        'documento': documento,
        'eps': eps,
      },
    );
  }

  Future<void> expireMyVerification() async {
    await _apiClient.dio.post('/verifications/expire-my');
  }
}