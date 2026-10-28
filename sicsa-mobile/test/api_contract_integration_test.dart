import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sicsa_mobile/core/network/api_client.dart';
import 'package:sicsa_mobile/core/storage/secure_storage_service.dart';
import 'package:sicsa_mobile/features/auth/models/login_model.dart';
import 'package:sicsa_mobile/features/auth/services/auth_service.dart';
import 'package:sicsa_mobile/features/patient/services/appointment_service.dart';
import 'package:sicsa_mobile/features/patient/services/verification_service.dart';

import 'support/fake_http_adapter.dart';

class MemoryStorage extends SecureStorageService {
  String? value;
  @override
  Future<void> saveToken(String token) async => value = token;
  @override
  Future<String?> getToken() async => value;
  @override
  Future<void> deleteToken() async => value = null;
}

String patientToken() {
  String encode(Object value) =>
      base64Url.encode(utf8.encode(jsonEncode(value))).replaceAll('=', '');
  return '${encode({'alg': 'none'})}.${encode({
        'sub': 4,
        'role': 'patient',
        'exp': DateTime.now()
                .toUtc()
                .add(const Duration(hours: 1))
                .millisecondsSinceEpoch ~/
            1000,
      })}.signature';
}

ApiClient client(FakeHttpAdapter adapter, MemoryStorage storage) {
  final dio = Dio(BaseOptions(baseUrl: 'http://sicsa.test'));
  dio.httpClientAdapter = adapter;
  return ApiClient(dio: dio, storageService: storage);
}

void main() {
  test('login guarda JWT paciente y usa el contrato email histórico', () async {
    final storage = MemoryStorage();
    final adapter = FakeHttpAdapter((options) => FakeHttpAdapter.json({
          'access_token': patientToken(),
          'user': {'role': 'patient', 'emailVerified': true},
        }));
    await AuthService(
            apiClient: client(adapter, storage), storageService: storage)
        .login(LoginModel(identifier: '3001234567', password: 'Valid123'));
    expect(storage.value, isNotNull);
    expect(adapter.requests.single.path, '/auth/login');
    expect(adapter.requests.single.data, {
      'email': '3001234567',
      'password': 'Valid123',
    });
  });

  test('disponibilidad, creación, paginación y cancelación respetan contrato',
      () async {
    final storage = MemoryStorage()..value = patientToken();
    final adapter = FakeHttpAdapter((options) {
      if (options.path == '/appointments/available') {
        return FakeHttpAdapter.json(['08:00', '08:20']);
      }
      if (options.path == '/appointments/my') {
        return FakeHttpAdapter.json({
          'data': [
            {'id': 8, 'estado': 'confirmada'}
          ],
          'page': 1,
          'limit': 20,
          'total': 1,
          'totalPages': 1,
        });
      }
      return FakeHttpAdapter.json({'id': 8, 'estado': 'confirmada'});
    });
    final service = AppointmentService(apiClient: client(adapter, storage));

    expect(
      await service.getAvailableHours(fecha: '2026-10-21', specialtyId: 13),
      ['08:00', '08:20'],
    );
    await service.createAppointment(
      fecha: '2026-10-21',
      hora: '08:00',
      motivo: 'Control general',
      specialtyId: 13,
      appointmentClassId: 2,
      edad: 65,
      discapacidad: true,
    );
    expect(await service.getMyAppointments(), hasLength(1));
    await service.cancelAppointment(8);

    final available = adapter.requests[0];
    expect(
        available.queryParameters, {'fecha': '2026-10-21', 'specialtyId': 13});
    expect(available.headers['Authorization'], startsWith('Bearer '));
    final create = adapter.requests[1];
    expect(create.data['appointmentClassId'], 2);
    expect(create.data['specialtyId'], 13);
    expect(create.data['discapacidad'], isTrue);
    expect(adapter.requests[2].queryParameters, {'page': 1, 'limit': 100});
    expect(adapter.requests[3].data, {'id': 8});
  });

  test('perfil y solicitud de verificación usan datos reales del perfil',
      () async {
    final storage = MemoryStorage()..value = patientToken();
    final adapter = FakeHttpAdapter((options) {
      if (options.path == '/patients/me' && options.method == 'GET') {
        return FakeHttpAdapter.json(
            {'numeroDocumento': '12345', 'eps': 'EPS Prueba'});
      }
      return FakeHttpAdapter.json({'estado': 'pendiente'});
    });
    final apiClient = client(adapter, storage);
    await VerificationService(apiClient: apiClient).requestVerification();
    final request = adapter.requests.last;
    expect(request.path, '/verifications/request');
    expect(request.data, {'documento': '12345', 'eps': 'EPS Prueba'});

    await AppointmentService(apiClient: apiClient).updateMyProfile({
      'telefono': '3001234567',
      'departamento': 'Nariño',
      'municipio': 'Pasto',
    });
    expect(adapter.requests.last.method, 'PATCH');
    expect(adapter.requests.last.path, '/patients/me');
  });

  test('401 elimina la sesión y expone un mensaje amigable', () async {
    final storage = MemoryStorage()..value = patientToken();
    final adapter = FakeHttpAdapter(
      (_) => FakeHttpAdapter.json({'message': 'Unauthorized'}, statusCode: 401),
    );
    final service = AppointmentService(apiClient: client(adapter, storage));
    await expectLater(service.cancelAppointment(1), throwsA(isA<Exception>()));
    expect(storage.value, isNull);
  });
}
