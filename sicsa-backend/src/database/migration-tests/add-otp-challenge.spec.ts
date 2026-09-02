import { QueryRunner } from 'typeorm';
import { AddOtpChallenge1787900000000 } from '../migrations/1787900000000-add-otp-challenge';

describe('AddOtpChallenge1787900000000', () => {
  it('crea una tabla aditiva con hashes, límites e índice activo único', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;
    const migration = new AddOtpChallenge1787900000000();

    await migration.up(runner);
    const calls = query.mock.calls as unknown as Array<[unknown]>;
    const sql = String(calls[0][0]);
    expect(sql).toContain('CREATE TABLE `otp_challenge`');
    expect(sql).toContain('`codeHash` char(64) NOT NULL');
    expect(sql).toContain('UNIQUE INDEX `UQ_otp_challenge_active_key`');

    await migration.down(runner);
    expect(calls[1][0]).toBe('DROP TABLE `otp_challenge`');
  });
});
