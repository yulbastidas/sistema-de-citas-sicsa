import unittest

from main import AppointmentData, calcular_prioridad


class PriorityEngineTest(unittest.TestCase):
    def test_structured_urgent_symptom_affects_real_engine(self):
        result = calcular_prioridad(
            AppointmentData(
                specialtyId=13,
                motivoConsulta="Consulta general",
                selectedSymptoms=["Dolor en el pecho"],
                painLevel="severe",
                symptomOnset="today",
            )
        )
        self.assertEqual(result.prioridad, "alta")
        self.assertTrue(result.alertaUrgencias)
        self.assertGreaterEqual(result.score, 40)

    def test_older_adult_is_derived_by_backend_input_and_prioritized(self):
        result = calcular_prioridad(
            AppointmentData(
                specialtyId=13,
                motivoConsulta="Control",
                edad=70,
            )
        )
        self.assertGreater(result.score, 0)
        self.assertTrue(any("adulta mayor" in reason.lower() for reason in result.razones))


if __name__ == "__main__":
    unittest.main()
