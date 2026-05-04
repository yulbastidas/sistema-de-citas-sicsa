import 'package:go_router/go_router.dart';

import '../features/auth/screens/login_screen.dart';
import '../features/register/models/register_models.dart';
import '../features/register/screens/register_screen.dart';
import '../features/register/screens/patient_profile_screen.dart';
import '../features/register/screens/verify_email_screen.dart';

import '../features/patient/screens/patient_dashboard_screen.dart';
import '../features/patient/screens/appointments_screen.dart';
import '../features/patient/screens/create_appointment_screen.dart';
import '../features/patient/screens/profile_screen.dart';

class AppRoutes {
  static final GoRouter router = GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/',
        redirect: (context, state) => '/login',
      ),

      // LOGIN
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),

      // REGISTER
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),

      // PROFILE REGISTER
      GoRoute(
        path: '/register/patient-profile',
        builder: (context, state) {
          final credentials = state.extra;

          if (credentials is! RegisterCredentials) {
            return const RegisterScreen();
          }

          return PatientProfileScreen(credentials: credentials);
        },
      ),

      // VERIFY EMAIL
      GoRoute(
        path: '/verify-email',
        builder: (context, state) {
          final email = state.extra;

          if (email is! String || email.isEmpty) {
            return const RegisterScreen();
          }

          return VerifyEmailScreen(email: email);
        },
      ),

      // DASHBOARD
      GoRoute(
        path: '/patient/dashboard',
        builder: (context, state) => const PatientDashboardScreen(),
      ),

      // MIS CITAS
      GoRoute(
        path: '/patient/appointments',
        builder: (context, state) => const AppointmentsScreen(),
      ),

      // CREAR CITA
      GoRoute(
        path: '/patient/create-appointment',
        builder: (context, state) => const CreateAppointmentScreen(),
      ),

      // PERFIL
      GoRoute(
        path: '/patient/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
}