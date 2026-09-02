import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  UpdateMyPatientDto,
  UpdatePatientByAdminDto,
} from './update-patient.dto';

describe('Patient update DTOs', () => {
  it('accepts the fields currently editable by the patient', async () => {
    const dto = plainToInstance(UpdateMyPatientDto, {
      telefono: '3001234567',
      email: '  PACIENTE@SICSA.TEST ',
      departamento: ' Nariño ',
      municipio: ' Pasto ',
      direccion: 'Calle 1 # 2-3',
      tipoSangre: 'O',
      factorRh: 'Positivo',
      alergias: 'Ninguna',
      enfermedadesCronicas: '',
      contactoEmergenciaNombre: 'María José',
      contactoEmergenciaTelefono: '300 123 4567',
      contactoEmergenciaParentesco: 'Madre',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.email).toBe('paciente@sicsa.test');
    expect(dto.departamento).toBe('Nariño');
  });

  it('rejects invalid patient-editable values', async () => {
    const dto = plainToInstance(UpdateMyPatientDto, {
      telefono: '2001234567',
      email: 'correo inválido',
      contactoEmergenciaNombre: 'Contacto123',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('accepts a complete valid administrative update', async () => {
    const dto = plainToInstance(UpdatePatientByAdminDto, {
      tipoDocumento: 'PASAPORTE',
      numeroDocumento: 'pa123456',
      primerNombre: 'Ana-María',
      segundoNombre: '',
      primerApellido: "O'Connor",
      segundoApellido: 'Muñoz',
      telefono: '3109876543',
      email: 'admin-edit@sicsa.test',
      eps: 'EPS Canónica',
      genero: 'Prefiero no decirlo',
      fechaNacimiento: '1990-05-20',
      departamento: 'Nariño',
      municipio: 'Pasto',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.numeroDocumento).toBe('PA123456');
  });

  it('rejects invalid administrative identity fields', async () => {
    const dto = plainToInstance(UpdatePatientByAdminDto, {
      tipoDocumento: 'CC',
      numeroDocumento: 'ABC123',
      primerNombre: 'Juan123',
      fechaNacimiento: '2026-02-31',
      genero: 'valor inventado',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
