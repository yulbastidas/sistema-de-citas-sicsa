import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/session_service.dart';

class SessionGateScreen extends StatefulWidget {
  const SessionGateScreen({super.key});

  @override
  State<SessionGateScreen> createState() => _SessionGateScreenState();
}

class _SessionGateScreenState extends State<SessionGateScreen> {
  @override
  void initState() {
    super.initState();
    _restore();
  }

  Future<void> _restore() async {
    final session = await SessionService().restorePatientSession();
    if (!mounted) return;
    context.go(session == null ? '/login' : '/patient/dashboard');
  }

  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
}
