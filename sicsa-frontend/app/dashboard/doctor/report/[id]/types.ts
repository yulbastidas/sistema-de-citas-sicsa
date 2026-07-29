export type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

export type MedicalReportForm = {
  motivoConsulta: string;
  enfermedadActual: string;

  antecedentes: string;
  antecedentesPersonales: string;
  antecedentesFamiliares: string;
  antecedentesQuirurgicos: string;
  antecedentesAlergicos: string;
  antecedentesFarmacologicos: string;

  signosVitales: string;
  presionArterial: string;
  frecuenciaCardiaca: string;
  frecuenciaRespiratoria: string;
  temperatura: string;
  saturacionOxigeno: string;
  peso: string;
  talla: string;
  imc: string;

  examenFisico: string;

  diagnostico: string;
  codigoCie10: string;

  tratamiento: string;
  recomendaciones: string;
  remision: string;
  observaciones: string;

  firmaDoctor: string;
};