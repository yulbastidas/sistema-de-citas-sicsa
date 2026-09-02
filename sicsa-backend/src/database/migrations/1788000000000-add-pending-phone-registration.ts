import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingPhoneRegistration1788000000000 implements MigrationInterface {
  name = 'AddPendingPhoneRegistration1788000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`pending_phone_registration\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`email\` varchar(150) NOT NULL,
        \`phoneE164\` varchar(13) NOT NULL,
        \`documentNumber\` varchar(20) NOT NULL,
        \`passwordHash\` varchar(255) NOT NULL,
        \`registrationData\` text NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_pending_phone_registration_email\` (\`email\`),
        UNIQUE INDEX \`UQ_pending_phone_registration_phone\` (\`phoneE164\`),
        UNIQUE INDEX \`UQ_pending_phone_registration_document\` (\`documentNumber\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `pending_phone_registration`');
  }
}
