import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerifiedPatientPhone1787800000000 implements MigrationInterface {
  name = 'AddVerifiedPatientPhone1787800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`patient\`
        ADD \`verifiedPhoneE164\` varchar(13) NULL,
        ADD \`phoneVerifiedAt\` datetime NULL,
        ADD \`phoneChangedAt\` datetime NULL,
        ADD UNIQUE INDEX \`UQ_patient_verified_phone_e164\` (\`verifiedPhoneE164\`)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`patient\`
        DROP INDEX \`UQ_patient_verified_phone_e164\`,
        DROP COLUMN \`phoneChangedAt\`,
        DROP COLUMN \`phoneVerifiedAt\`,
        DROP COLUMN \`verifiedPhoneE164\`
    `);
  }
}
