import 'package:flutter/material.dart';

InputDecoration registerInputDecoration({
  required String label,
  required IconData icon,
}) {
  return InputDecoration(
    labelText: label,
    prefixIcon: Icon(icon),
  );
}