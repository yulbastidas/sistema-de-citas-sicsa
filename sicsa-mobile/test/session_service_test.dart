import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:sicsa_mobile/core/auth/session_service.dart';

String token(Map<String, Object> payload) {
  final header = base64Url
      .encode(utf8.encode(jsonEncode({'alg': 'none'})))
      .replaceAll('=', '');
  final body =
      base64Url.encode(utf8.encode(jsonEncode(payload))).replaceAll('=', '');
  return '$header.$body.signature';
}

void main() {
  final service = SessionService();

  test('acepta un JWT de paciente vigente', () {
    final parsed = service.parseToken(token({
      'sub': 7,
      'role': 'patient',
      'exp': DateTime.now()
              .toUtc()
              .add(const Duration(hours: 1))
              .millisecondsSinceEpoch ~/
          1000,
    }));
    expect(parsed?.isPatient, isTrue);
    expect(parsed?.isExpired, isFalse);
    expect(parsed?.userId, 7);
  });

  test('rechaza tokens mal formados', () {
    expect(service.parseToken('not-a-jwt'), isNull);
  });

  test('identifica token vencido y rol no paciente', () {
    final parsed = service.parseToken(token({
      'sub': 1,
      'role': 'admin',
      'exp': DateTime.now()
              .toUtc()
              .subtract(const Duration(minutes: 1))
              .millisecondsSinceEpoch ~/
          1000,
    }));
    expect(parsed?.isPatient, isFalse);
    expect(parsed?.isExpired, isTrue);
  });
}
