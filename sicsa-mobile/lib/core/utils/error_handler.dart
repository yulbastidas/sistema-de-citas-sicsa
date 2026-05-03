import 'package:dio/dio.dart';

class ErrorHandler {
  static String getErrorMessage(dynamic error) {
    if (error is DioException) {
      if (error.response != null && error.response?.data != null) {
        final data = error.response?.data;
        if (data is Map && data['message'] != null) {
          return data['message'].toString();
        }
        if (data is String) {
          return data;
        }
      }
      return error.message ?? 'Error de red';
    }
    return error?.toString() ?? 'Error desconocido';
  }
}
