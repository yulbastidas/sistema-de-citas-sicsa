import 'package:flutter/material.dart';

class WaitlistCard extends StatelessWidget {
  final bool loading;
  final VoidCallback onJoinWaitlist;

  const WaitlistCard({
    super.key,
    required this.loading,
    required this.onJoinWaitlist,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.hourglass_bottom_outlined,
                color: Color(0xFF92400E),
              ),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'No hay horarios disponibles',
                  style: TextStyle(
                    color: Color(0xFF92400E),
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Puedes unirte a la lista de espera para este día. Si se libera un cupo, el sistema podrá reasignarte automáticamente según prioridad.',
            style: TextStyle(
              color: Color(0xFF78350F),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: loading ? null : onJoinWaitlist,
              icon: loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.playlist_add_outlined),
              label: Text(
                loading ? 'Uniendo...' : 'Unirme a lista de espera',
              ),
            ),
          ),
        ],
      ),
    );
  }
}