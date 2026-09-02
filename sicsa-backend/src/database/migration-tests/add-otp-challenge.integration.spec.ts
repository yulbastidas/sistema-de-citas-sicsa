import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { AddOtpChallenge1787900000000 } from '../migrations/1787900000000-add-otp-challenge';

const describeMySql =
  process.env.RUN_MYSQL_MIGRATION_TESTS === '1' ? describe : describe.skip;

describeMySql('OTP challenge migration (local MySQL)', () => {
  const databaseName = `sicsa_otp_test_${process.pid}`;
  let adminDataSource: DataSource;
  let testDataSource: DataSource;

  beforeAll(async () => {
    dotenv.config({ path: resolve(process.cwd(), '../.env') });
    adminDataSource = new DataSource({
      type: 'mysql',
      host: '127.0.0.1',
      port: Number(process.env.TEST_DB_PORT ?? 3307),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    });
    await adminDataSource.initialize();
    await adminDataSource.query(`CREATE DATABASE \`${databaseName}\``);
    testDataSource = new DataSource({
      type: 'mysql',
      host: '127.0.0.1',
      port: Number(process.env.TEST_DB_PORT ?? 3307),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: databaseName,
    });
    await testDataSource.initialize();
  });

  afterAll(async () => {
    if (testDataSource?.isInitialized) await testDataSource.destroy();
    if (adminDataSource?.isInitialized) {
      if (!databaseName.startsWith('sicsa_otp_test_')) {
        throw new Error('Nombre de base de prueba inesperado');
      }
      await adminDataSource.query(
        `DROP DATABASE IF EXISTS \`${databaseName}\``,
      );
      await adminDataSource.destroy();
    }
  });

  it('crea, aplica unicidad del challenge activo y revierte', async () => {
    const migration = new AddOtpChallenge1787900000000();
    const queryRunner = testDataSource.createQueryRunner();
    await queryRunner.connect();
    const values = [
      7,
      'phone_verification',
      'a'.repeat(64),
      '+573001234567',
      'b'.repeat(64),
      'c'.repeat(64),
      'd'.repeat(64),
      new Date(),
      new Date(),
    ];

    try {
      await migration.up(queryRunner);
      const insertSql = `
        INSERT INTO \`otp_challenge\`
          (\`id\`, \`userId\`, \`purpose\`, \`phoneHash\`, \`phoneE164\`, \`ipHash\`, \`activeKey\`, \`codeHash\`, \`expiresAt\`, \`resendAvailableAt\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await queryRunner.query(insertSql, ['challenge-1', ...values]);
      await expect(
        queryRunner.query(insertSql, ['challenge-2', ...values]),
      ).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });

      await migration.down(queryRunner);
      const tables = (await queryRunner.query(
        "SHOW TABLES LIKE 'otp_challenge'",
      )) as unknown[];
      expect(tables).toHaveLength(0);
    } finally {
      await queryRunner.release();
    }
  });
});
