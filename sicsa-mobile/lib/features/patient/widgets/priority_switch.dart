import 'package:flutter/material.dart';

class PrioritySwitch extends StatelessWidget {
  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  const PrioritySwitch({
    super.key,
    required this.title,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      value: value,
      onChanged: onChanged,
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          color: Color(0xFF334155),
        ),
      ),
      activeColor: const Color(0xFF0F766E),
      contentPadding: EdgeInsets.zero,
    );
  }
}