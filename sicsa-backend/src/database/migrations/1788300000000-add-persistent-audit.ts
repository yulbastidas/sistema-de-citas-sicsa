import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersistentAudit1788300000000 implements MigrationInterface {
  name = 'AddPersistentAudit1788300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`audit_event\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`actorUserId\` INT NULL,
        \`actorRole\` VARCHAR(30) NOT NULL,
        \`action\` VARCHAR(80) NOT NULL,
        \`resourceType\` VARCHAR(50) NOT NULL,
        \`resourceId\` VARCHAR(80) NULL,
        \`result\` VARCHAR(20) NOT NULL,
        \`occurredAt\` DATETIME(3) NOT NULL,
        \`correlationId\` VARCHAR(80) NULL,
        \`ipFingerprint\` CHAR(64) NULL,
        \`metadata\` JSON NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_audit_occurred_at\` (\`occurredAt\`),
        INDEX \`IDX_audit_actor_occurred\` (\`actorUserId\`, \`occurredAt\`),
        INDEX \`IDX_audit_resource_occurred\` (\`resourceType\`, \`resourceId\`, \`occurredAt\`),
        INDEX \`IDX_audit_action_occurred\` (\`action\`, \`occurredAt\`),
        CONSTRAINT \`FK_audit_actor_user\`
          FOREIGN KEY (\`actorUserId\`) REFERENCES \`user\` (\`id\`)
          ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `audit_event`');
  }
}
