import type { BookingCatalogItem } from "./types";

const COMMON = [
  "Fiebre", "Tos", "Dolor de cabeza", "Dolor abdominal", "Náuseas o vómito",
  "Dificultad para respirar", "Dolor en el pecho", "Diarrea", "Mareo",
  "Dolor muscular", "Fatiga", "Erupciones en la piel", "Sangrado",
];

const DENTAL = [
  "Dolor dental", "Caries", "Diente fracturado", "Inflamación de encía",
  "Sangrado de encías", "Golpe o trauma dental", "Inflamación facial",
  "Dificultad para abrir la boca", "Sensibilidad dental", "Mal aliento persistente",
];

const GYNECOLOGY = [
  "Control ginecológico", "Dolor pélvico", "Sangrado anormal", "Flujo o molestias",
  "Planificación familiar", "Control de embarazo", "Irregularidad menstrual", "Fiebre",
];

const PEDIATRICS = [
  "Control de crecimiento", "Fiebre", "Tos", "Dolor", "Náuseas o vómito",
  "Problemas digestivos", "Diarrea", "Erupción en la piel", "Dificultad para respirar",
  "Falta de apetito", "Fatiga",
];

const MENTAL_HEALTH = [
  "Primera valoración", "Control", "Ansiedad", "Cambios de ánimo",
  "Problemas de sueño", "Seguimiento de tratamiento", "Crisis emocional",
  "Dificultad para concentrarse", "Estrés",
];

const GENERIC = [
  "Primera valoración", "Control", "Seguimiento de tratamiento",
  "Procedimiento programado", "Dolor", "Fiebre", "Otro motivo",
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function getClinicalOptions(specialtyId: string, specialties: BookingCatalogItem[]) {
  const specialty = specialties.find((item) => String(item.id) === specialtyId);
  const name = normalize(specialty?.nombre || "");
  if (specialtyId === "15" || name.includes("odontolog") || name.includes("higiene oral")) return DENTAL;
  if (name.includes("ginecolog") || name.includes("obstetric")) return GYNECOLOGY;
  if (name.includes("pediatr")) return PEDIATRICS;
  if (name.includes("psicolog") || name.includes("psiquiatr")) return MENTAL_HEALTH;
  if (specialtyId === "13" || name.includes("medicina general") || name.includes("medico general")) return COMMON;
  return GENERIC;
}
