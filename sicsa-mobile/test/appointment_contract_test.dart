import 'package:flutter_test/flutter_test.dart';
import 'package:sicsa_mobile/features/patient/services/appointment_service.dart';

void main() {
  test('disponibilidad usa specialtyId y no appointmentClassId', () {
    final query = AppointmentService.availabilityQuery(
      fecha: '2026-10-21',
      specialtyId: 13,
    );
    expect(query, {'fecha': '2026-10-21', 'specialtyId': 13});
    expect(query.containsKey('appointmentClassId'), isFalse);
  });

  test('creación exige y envía specialtyId y appointmentClassId', () {
    final payload = AppointmentService.buildCreatePayload(
      fecha: '2026-10-21',
      hora: '08:00',
      motivo: 'Control general',
      specialtyId: 13,
      appointmentClassId: 2,
      edad: 65,
      discapacidad: true,
    );
    expect(payload['specialtyId'], 13);
    expect(payload['appointmentClassId'], 2);
    expect(payload['edad'], 65);
    expect(payload['discapacidad'], isTrue);
    expect(payload['embarazada'], isFalse);
  });
}
