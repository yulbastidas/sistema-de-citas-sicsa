import type { QueryRunner } from 'typeorm';
import { AddVerifiedPatientPhone1787800000000 } from '../migrations/1787800000000-add-verified-patient-phone';

describe('AddVerifiedPatientPhone1787800000000', () => {
  it('adds nullable security fields and a unique phone index', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddVerifiedPatientPhone1787800000000();

    await migration.up({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain(
      'ADD `verifiedPhoneE164` varchar(13) NULL',
    );
    expect(query.mock.calls[0][0]).toContain(
      'ADD UNIQUE INDEX `UQ_patient_verified_phone_e164`',
    );
    expect(query.mock.calls[0][0]).not.toContain('UPDATE');
  });

  it('removes only the fields introduced by this migration', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddVerifiedPatientPhone1787800000000();

    await migration.down({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain(
      'DROP INDEX `UQ_patient_verified_phone_e164`',
    );
    expect(query.mock.calls[0][0]).toContain('DROP COLUMN `verifiedPhoneE164`');
    expect(query.mock.calls[0][0]).not.toContain('DROP COLUMN `telefono`');
  });
});
