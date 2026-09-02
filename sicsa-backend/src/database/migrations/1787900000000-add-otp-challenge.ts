import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtpChallenge1787900000000 implements MigrationInterface {
  name = 'AddOtpChallenge1787900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`otp_challenge\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` int NOT NULL,
        \`purpose\` varchar(40) NOT NULL,
        \`phoneHash\` char(64) NOT NULL,
        \`phoneE164\` varchar(13) NOT NULL,
        \`ipHash\` char(64) NOT NULL,
        \`activeKey\` char(64) NULL,
        \`codeHash\` char(64) NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`resendAvailableAt\` datetime NOT NULL,
        \`attempts\` tinyint unsigned NOT NULL DEFAULT 0,
        \`consumedAt\` datetime NULL,
        \`invalidatedAt\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_otp_challenge_active_key\` (\`activeKey\`),
        INDEX \`IDX_otp_challenge_phone_purpose_created\` (\`phoneHash\`, \`purpose\`, \`createdAt\`),
        INDEX \`IDX_otp_challenge_user_purpose_created\` (\`userId\`, \`purpose\`, \`createdAt\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `otp_challenge`');
  }
}
