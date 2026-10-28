import 'package:dio/dio.dart';

class ErrorHandler {
  static String getErrorMessage(dynamic error) {
    if (error is DioException) {
      if (error.response != null && error.response?.data != null) {
        final data = error.response?.data;
        if (data is Map && data['message'] != null) {
          final message = data['message'];
          if (message is List) {
            return message.join(', ');
          }
          return message.toString();
        }
        if (data is String) {
          return data;
        }
      }
      if (error.response?.statusCode == 401) {
        return 'Tu sesión venció. Inicia sesión nuevamente.';
      }
      if (error.response?.statusCode == 403) {
        return 'No tienes permiso para realizar esta acción.';
      }
      if (error.response?.statusCode == 409) {
        return 'La información cambió. Actualiza e inténtalo nuevamente.';
      }
      if (error.response?.statusCode == 429) {
        return 'Demasiados intentos. Espera antes de volver a intentar.';
      }
      return 'No fue posible conectar con SICSA. Revisa tu conexión.';
    }
    return error?.toString() ?? 'Error desconocido';
  }
}
