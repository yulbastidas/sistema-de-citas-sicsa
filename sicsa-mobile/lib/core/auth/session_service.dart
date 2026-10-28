import 'dart:convert';

import '../storage/secure_storage_service.dart';

class SessionInfo {
  const SessionInfo(
      {required this.userId, required this.role, required this.expiresAt});

  final int? userId;
  final String role;
  final DateTime expiresAt;

  bool get isExpired => !expiresAt.isAfter(DateTime.now().toUtc());
  bool get isPatient => role == 'patient';
}

class SessionService {
  SessionService({SecureStorageService? storage})
      : _storage = storage ?? SecureStorageService();

  final SecureStorageService _storage;

  Future<SessionInfo?> restorePatientSession() async {
    final token = await _storage.getToken();
    final session = parseToken(token);
    if (session == null || session.isExpired || !session.isPatient) {
      await _storage.deleteToken();
      return null;
    }
    return session;
  }

  SessionInfo? parseToken(String? token) {
    if (token == null || token.isEmpty) return null;
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      final payload = jsonDecode(
        utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
      );
      if (payload is! Map<String, dynamic>) return null;
      final exp = payload['exp'];
      final role = payload['role']?.toString().toLowerCase();
      if (exp is! num || role == null) return null;
      return SessionInfo(
        userId: payload['sub'] is num ? (payload['sub'] as num).toInt() : null,
        role: role,
        expiresAt: DateTime.fromMillisecondsSinceEpoch(
          exp.toInt() * 1000,
          isUtc: true,
        ),
      );
    } catch (_) {
      return null;
    }
  }
}
