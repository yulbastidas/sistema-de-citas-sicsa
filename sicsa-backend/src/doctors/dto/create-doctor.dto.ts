export class CreateDoctorDto {
  userId!: number;
  nombre!: string;
  especialidadId!: number;
  registroMedico?: string;
  consultorio?: string;
}
