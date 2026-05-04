export type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

export type MedicalReportForm = {
  enfermedadActual: string;
  antecedentes: string;
  signosVitales: string;
  examenFisico: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
};
