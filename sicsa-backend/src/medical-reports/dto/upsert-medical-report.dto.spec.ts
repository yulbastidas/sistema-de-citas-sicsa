import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpsertMedicalReportDto } from './upsert-medical-report.dto';

describe('UpsertMedicalReportDto', () => {
  it('acepta y normaliza un reporte técnico válido', async () => {
    const dto = plainToInstance(UpsertMedicalReportDto, {
      appointmentId: 10,
      diagnostico: '  Diagnóstico registrado  ',
      presionArterial: ' 120/80 ',
      codigoCie10: ' Z00.0 ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.diagnostico).toBe('Diagnóstico registrado');
    expect(dto.presionArterial).toBe('120/80');
    expect(dto.codigoCie10).toBe('Z00.0');
  });

  it.each([
    ['appointmentId cero', { appointmentId: 0 }],
    ['appointmentId negativo', { appointmentId: -1 }],
    ['signo vital demasiado largo', { presionArterial: 'x'.repeat(21) }],
    ['CIE-10 demasiado largo', { codigoCie10: 'x'.repeat(31) }],
    ['texto clínico demasiado largo', { diagnostico: 'x'.repeat(10001) }],
    ['tipo incorrecto', { observaciones: 123 }],
  ])('rechaza %s', async (_case, changes) => {
    const dto = plainToInstance(UpsertMedicalReportDto, {
      appointmentId: 10,
      ...changes,
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
