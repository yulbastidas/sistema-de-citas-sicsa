import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { AddVerifiedPatientPhone1787800000000 } from '../migrations/1787800000000-add-verified-patient-phone';

const describeMySql =
  process.env.RUN_MYSQL_MIGRATION_TESTS === '1' ? describe : describe.skip;

describeMySql('verified patient phone migration (local MySQL)', () => {
  const databaseName = `sicsa_phone_model_test_${process.pid}`;
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
    await testDataSource.query(`
      CREATE TABLE \`patient\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`telefono\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await testDataSource.query(
      "INSERT INTO `patient` (`telefono`) VALUES ('3000000001'), ('3000000001')",
    );
  });

  afterAll(async () => {
    if (testDataSource?.isInitialized) await testDataSource.destroy();
    if (adminDataSource?.isInitialized) {
      if (!databaseName.startsWith('sicsa_phone_model_test_')) {
        throw new Error('Nombre de base de prueba inesperado');
      }
      await adminDataSource.query(
        `DROP DATABASE IF EXISTS \`${databaseName}\``,
      );
      await adminDataSource.destroy();
    }
  });

  it('supports historical NULL values, enforces uniqueness and rolls back', async () => {
    const migration = new AddVerifiedPatientPhone1787800000000();
    const queryRunner = testDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await migration.up(queryRunner);

      const historicalPatients = (await queryRunner.query(
        'SELECT `verifiedPhoneE164` FROM `patient` ORDER BY `id`',
      )) as Array<{ verifiedPhoneE164: string | null }>;
      expect(historicalPatients).toEqual([
        { verifiedPhoneE164: null },
        { verifiedPhoneE164: null },
      ]);

      await queryRunner.query(
        "INSERT INTO `patient` (`telefono`) VALUES ('3000000002'), ('3000000003')",
      );
      await queryRunner.query(
        "UPDATE `patient` SET `verifiedPhoneE164` = '+573001234567' WHERE `id` = 1",
      );
      await expect(
        queryRunner.query(
          "UPDATE `patient` SET `verifiedPhoneE164` = '+573001234567' WHERE `id` = 2",
        ),
      ).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });

      await migration.down(queryRunner);
      const columns = (await queryRunner.query(
        'SHOW COLUMNS FROM `patient`',
      )) as Array<{ Field: string }>;
      expect(columns.map(({ Field }) => Field)).toEqual(['id', 'telefono']);
    } finally {
      await queryRunner.release();
    }
  });
});
