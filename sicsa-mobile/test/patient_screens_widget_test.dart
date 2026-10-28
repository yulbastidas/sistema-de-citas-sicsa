import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sicsa_mobile/features/patient/screens/appointments_screen.dart';
import 'package:sicsa_mobile/features/patient/screens/create_appointment_screen.dart';
import 'package:sicsa_mobile/features/patient/screens/patient_dashboard_screen.dart';
import 'package:sicsa_mobile/features/patient/screens/profile_screen.dart';
import 'package:sicsa_mobile/features/patient/services/appointment_service.dart';
import 'package:sicsa_mobile/features/patient/services/verification_service.dart';
import 'package:sicsa_mobile/features/patient/widgets/appointment_card.dart';

class FakeAppointments extends AppointmentService {
  @override
  Future<Map<String, dynamic>> getMyProfile() async => {
        'primerNombre': 'Paciente',
        'primerApellido': 'Prueba',
        'tipoDocumento': 'CC',
        'numeroDocumento': '100000',
        'email': 'paciente@example.test',
        'telefono': '3000000000',
        'eps': 'EPS Prueba',
        'departamento': 'Nariño',
        'municipio': 'Pasto',
        'fechaNacimiento': '1990-01-01',
      };

  @override
  Future<List<dynamic>> getSpecialties() async => [
        {'id': 13, 'nombre': 'Médico general'},
        {'id': 20, 'nombre': 'Psicología'},
      ];

  @override
  Future<List<dynamic>> getAppointmentClasses() async => [
        {'id': 1, 'nombre': 'Primera vez'},
        {'id': 2, 'nombre': 'Control'},
      ];

  @override
  Future<List<dynamic>> getMyAppointments(
          {int page = 1, int limit = 100}) async =>
      [
        {
          'id': 1,
          'fecha': '2026-10-21',
          'hora': '08:00',
          'estado': 'confirmada',
          'motivoConsulta': 'Control general',
          'specialty': {'nombre': 'Médico general'},
          'appointmentClass': {'nombre': 'Control'},
          'doctor': {'primerNombre': 'Ana', 'primerApellido': 'Paz'},
        },
        {
          'id': 2,
          'fecha': '2026-10-22',
          'hora': '09:00',
          'estado': 'lista_espera',
          'motivoConsulta': 'Consulta',
          'specialty': {'nombre': 'Psicología'},
        },
      ];
}

class FakeVerification extends VerificationService {
  @override
  Future<Map<String, dynamic>?> getMyVerification() async => {
        'estado': 'aprobado',
        'documento': '100000',
        'eps': 'EPS Prueba',
      };
}

Widget phone(Widget child) => MaterialApp(
      home: MediaQuery(
        data: const MediaQueryData(size: Size(390, 844)),
        child: child,
      ),
    );

void main() {
  testWidgets('dashboard aprobado se renderiza sin overflow', (tester) async {
    await tester.pumpWidget(phone(PatientDashboardScreen(
      verificationService: FakeVerification(),
    )));
    await tester.pumpAndSettle();
    expect(find.text('Verificación aprobada'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('mis citas muestra estados, clase y médico', (tester) async {
    await tester
        .pumpWidget(phone(AppointmentsScreen(service: FakeAppointments())));
    await tester.pumpAndSettle();
    expect(find.text('Médico general'), findsOneWidget);
    final firstCard = tester.widget<AppointmentCard>(
      find.byType(AppointmentCard).first,
    );
    expect(firstCard.claseCita, 'Control');
    expect(firstCard.medico, 'Ana Paz');
    expect(find.text('Lista de espera'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('perfil ficticio se carga sin red', (tester) async {
    await tester.pumpWidget(phone(ProfileScreen(service: FakeAppointments())));
    await tester.pumpAndSettle();
    expect(find.text('Paciente Prueba'), findsOneWidget);
    expect(find.text('EPS Prueba'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('creación carga catálogos y factores administrativos',
      (tester) async {
    await tester.pumpWidget(
        phone(CreateAppointmentScreen(service: FakeAppointments())));
    await tester.pumpAndSettle();
    expect(find.text('Nueva cita'), findsOneWidget);
    expect(find.textContaining('Especialidad'), findsWidgets);
    expect(find.text('Embarazada', skipOffstage: false), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
