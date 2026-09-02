import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrivilegedMfa1788100000000 implements MigrationInterface {
  name = 'AddPrivilegedMfa1788100000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `user` ADD `tokenVersion` int NOT NULL DEFAULT 0');
    await queryRunner.query(`CREATE TABLE \`mfa_credentials\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`encryptedSecret\` text NOT NULL, \`enabled\` tinyint NOT NULL DEFAULT 0, \`enrolledAt\` datetime NULL, \`lastUsedTotpStep\` bigint NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`UQ_mfa_credentials_user\` (\`userId\`), PRIMARY KEY (\`id\`), CONSTRAINT \`FK_mfa_credentials_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`mfa_recovery_codes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`codeHash\` varchar(255) NOT NULL, \`usedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_mfa_recovery_user_unused\` (\`userId\`, \`usedAt\`), PRIMARY KEY (\`id\`), CONSTRAINT \`FK_mfa_recovery_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`mfa_challenges\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`tokenHash\` varchar(64) NOT NULL, \`purpose\` varchar(20) NOT NULL, \`expiresAt\` datetime NOT NULL, \`usedAt\` datetime NULL, \`attempts\` int NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_mfa_challenge_token\` (\`tokenHash\`), INDEX \`IDX_mfa_challenge_user\` (\`userId\`, \`usedAt\`), PRIMARY KEY (\`id\`), CONSTRAINT \`FK_mfa_challenge_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE) ENGINE=InnoDB`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `mfa_challenges`');
    await queryRunner.query('DROP TABLE `mfa_recovery_codes`');
    await queryRunner.query('DROP TABLE `mfa_credentials`');
    await queryRunner.query('ALTER TABLE `user` DROP COLUMN `tokenVersion`');
  }
}
