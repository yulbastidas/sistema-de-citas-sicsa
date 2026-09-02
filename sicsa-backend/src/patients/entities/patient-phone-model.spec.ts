import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { getMetadataArgsStorage } from 'typeorm';
import { UpdatePatientByAdminDto } from '../dto/update-patient.dto';
import { Patient } from './patient.entity';

describe('Patient verified phone model', () => {
  it('keeps security-owned phone fields out of regular TypeORM selections', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      ({ target }) => target === Patient,
    );

    for (const propertyName of [
      'verifiedPhoneE164',
      'phoneVerifiedAt',
      'phoneChangedAt',
    ]) {
      const column = columns.find(
        ({ propertyName: candidate }) => candidate === propertyName,
      );
      expect(column?.options.nullable).toBe(true);
      expect(column?.options.select).toBe(false);
    }
  });

  it('does not allow an administrative profile DTO to set verification fields', async () => {
    const dto = plainToInstance(UpdatePatientByAdminDto, {
      telefono: '3001234567',
      verifiedPhoneE164: '+573001234567',
      phoneVerifiedAt: '2026-08-27T12:00:00.000Z',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['verifiedPhoneE164', 'phoneVerifiedAt']),
    );
  });
});
