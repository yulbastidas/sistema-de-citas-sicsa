import 'package:flutter_test/flutter_test.dart';
import 'package:sicsa_mobile/core/utils/colombian_holidays.dart';

void main() {
  test('bloquea lunes y domingo', () {
    expect(ColombianHolidays.isClosedDay(DateTime(2026, 10, 19)), isTrue);
    expect(ColombianHolidays.isClosedDay(DateTime(2026, 10, 18)), isTrue);
  });

  test('incluye festivos fijos colombianos', () {
    final holidays = ColombianHolidays.holidaysForYear(2026);
    expect(holidays, contains(DateTime(2026, 1, 1)));
    expect(holidays, contains(DateTime(2026, 7, 20)));
    expect(holidays, contains(DateTime(2026, 12, 25)));
  });

  test('incluye jueves y viernes santos', () {
    final holidays = ColombianHolidays.holidaysForYear(2026);
    expect(holidays, contains(DateTime(2026, 4, 2)));
    expect(holidays, contains(DateTime(2026, 4, 3)));
  });

  test('traslada Epifanía al lunes', () {
    expect(ColombianHolidays.holidaysForYear(2026),
        contains(DateTime(2026, 1, 12)));
  });
}
