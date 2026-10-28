class ColombianHolidays {
  static bool isClosedDay(DateTime date) {
    final local = DateTime(date.year, date.month, date.day);
    return local.weekday == DateTime.monday ||
        local.weekday == DateTime.sunday ||
        holidaysForYear(local.year).contains(local);
  }

  static Set<DateTime> holidaysForYear(int year) {
    final easter = _easterSunday(year);
    return {
      DateTime(year, 1, 1),
      _nextMonday(DateTime(year, 1, 6)),
      _nextMonday(DateTime(year, 3, 19)),
      easter.subtract(const Duration(days: 3)),
      easter.subtract(const Duration(days: 2)),
      DateTime(year, 5, 1),
      _nextMonday(easter.add(const Duration(days: 39))),
      _nextMonday(easter.add(const Duration(days: 60))),
      _nextMonday(easter.add(const Duration(days: 68))),
      _nextMonday(DateTime(year, 6, 29)),
      DateTime(year, 7, 20),
      DateTime(year, 8, 7),
      _nextMonday(DateTime(year, 8, 15)),
      _nextMonday(DateTime(year, 10, 12)),
      _nextMonday(DateTime(year, 11, 1)),
      _nextMonday(DateTime(year, 11, 11)),
      DateTime(year, 12, 8),
      DateTime(year, 12, 25),
    };
  }

  static DateTime _nextMonday(DateTime date) {
    final days = (DateTime.monday - date.weekday + 7) % 7;
    return DateTime(date.year, date.month, date.day + days);
  }

  static DateTime _easterSunday(int year) {
    final a = year % 19;
    final b = year ~/ 100;
    final c = year % 100;
    final d = b ~/ 4;
    final e = b % 4;
    final f = (b + 8) ~/ 25;
    final g = (b - f + 1) ~/ 3;
    final h = (19 * a + b - d - g + 15) % 30;
    final i = c ~/ 4;
    final k = c % 4;
    final l = (32 + 2 * e + 2 * i - h - k) % 7;
    final m = (a + 11 * h + 22 * l) ~/ 451;
    final month = (h + l - 7 * m + 114) ~/ 31;
    final day = ((h + l - 7 * m + 114) % 31) + 1;
    return DateTime(year, month, day);
  }
}
