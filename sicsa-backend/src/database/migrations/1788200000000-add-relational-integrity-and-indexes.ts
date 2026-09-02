import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationalIntegrityAndIndexes1788200000000
  implements MigrationInterface
{
  name = 'AddRelationalIntegrityAndIndexes1788200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.assertCompatibleData(queryRunner);

    await queryRunner.query(
      'ALTER TABLE `patient` ADD CONSTRAINT `UQ_patient_user_id` UNIQUE (`userId`)',
    );
    await queryRunner.query(
      'ALTER TABLE `patient` ADD CONSTRAINT `UQ_patient_document_type_number` UNIQUE (`tipoDocumento`, `numeroDocumento`)',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_patient_document_number` ON `patient` (`numeroDocumento`)',
    );
    await queryRunner.query(
      'ALTER TABLE `patient` ADD CONSTRAINT `FK_patient_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );

    await queryRunner.query(
      'ALTER TABLE `doctor` ADD CONSTRAINT `UQ_doctor_user_id` UNIQUE (`userId`)',
    );
    await queryRunner.query(
      'ALTER TABLE `doctor` ADD CONSTRAINT `UQ_doctor_medical_registration` UNIQUE (`registroMedico`)',
    );
    await queryRunner.query(
      'ALTER TABLE `doctor` ADD CONSTRAINT `FK_doctor_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_doctor_specialty_active_id` ON `doctor` (`especialidadId`, `activo`, `id`)',
    );
    await queryRunner.query(
      'DROP INDEX `FK_ca9d7be1f6af3da02becdfa715c` ON `doctor`',
    );

    await queryRunner.query(
      'CREATE INDEX `IDX_appointment_doctor_date_status` ON `appointment` (`doctorId`, `fecha`(10), `estado`(30))',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_appointment_doctor_date_time` ON `appointment` (`doctorId`, `fecha`(10), `hora`(5))',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_appointment_patient_date` ON `appointment` (`patientId`, `fecha`(10))',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_appointment_specialty_waitlist` ON `appointment` (`specialtyId`, `fecha`(10), `estado`(30), `scorePrioridad` DESC, `hora`(5) ASC, `id` ASC)',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_appointment_date_status_time` ON `appointment` (`fecha`(10), `estado`(30), `hora`(5))',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_appointment_eps` ON `appointment` (`epsId`)',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_appointment_class` ON `appointment` (`appointmentClassId`)',
    );
    await queryRunner.query(
      'ALTER TABLE `appointment` ADD CONSTRAINT `FK_appointment_patient_profile` FOREIGN KEY (`patientId`) REFERENCES `patient` (`userId`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'ALTER TABLE `appointment` ADD CONSTRAINT `FK_appointment_doctor` FOREIGN KEY (`doctorId`) REFERENCES `doctor` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'ALTER TABLE `appointment` ADD CONSTRAINT `FK_appointment_specialty` FOREIGN KEY (`specialtyId`) REFERENCES `specialty` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'ALTER TABLE `appointment` ADD CONSTRAINT `FK_appointment_eps` FOREIGN KEY (`epsId`) REFERENCES `eps` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'ALTER TABLE `appointment` ADD CONSTRAINT `FK_appointment_class` FOREIGN KEY (`appointmentClassId`) REFERENCES `appointment_class` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );

    await queryRunner.query(
      'CREATE INDEX `IDX_verification_patient_latest` ON `verification` (`patientId`, `id`)',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_verification_admin` ON `verification` (`adminId`)',
    );
    await queryRunner.query(
      'ALTER TABLE `verification` ADD CONSTRAINT `FK_verification_patient_profile` FOREIGN KEY (`patientId`) REFERENCES `patient` (`userId`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
    await queryRunner.query(
      'ALTER TABLE `verification` ADD CONSTRAINT `FK_verification_admin` FOREIGN KEY (`adminId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );

    await queryRunner.query(
      'CREATE INDEX `IDX_email_verification_active_lookup` ON `email_verification_code` (`email`, `used`, `id`)',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_email_verification_user` ON `email_verification_code` (`userId`)',
    );
    await queryRunner.query(
      'ALTER TABLE `email_verification_code` ADD CONSTRAINT `FK_email_verification_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    );

    await queryRunner.query(
      'CREATE INDEX `IDX_password_reset_active_lookup` ON `password_reset_codes` (`email`, `used`, `expiresAt`, `createdAt`)',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_password_reset_user` ON `password_reset_codes` (`userId`)',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_3a2204bbed360cd62320bf0c77` ON `password_reset_codes`',
    );
    await queryRunner.query(
      'ALTER TABLE `password_reset_codes` ADD CONSTRAINT `FK_password_reset_user` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    );

    await queryRunner.query(
      'DROP INDEX `IDX_b4cf30f26e44efcaa424970e04` ON `medical_reports`',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX `IDX_b4cf30f26e44efcaa424970e04` ON `medical_reports` (`appointmentId`)',
    );

    await queryRunner.query(
      'ALTER TABLE `password_reset_codes` DROP FOREIGN KEY `FK_password_reset_user`',
    );
    await queryRunner.query(
      'CREATE INDEX `IDX_3a2204bbed360cd62320bf0c77` ON `password_reset_codes` (`email`)',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_password_reset_user` ON `password_reset_codes`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_password_reset_active_lookup` ON `password_reset_codes`',
    );

    await queryRunner.query(
      'ALTER TABLE `email_verification_code` DROP FOREIGN KEY `FK_email_verification_user`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_email_verification_user` ON `email_verification_code`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_email_verification_active_lookup` ON `email_verification_code`',
    );

    await queryRunner.query(
      'ALTER TABLE `verification` DROP FOREIGN KEY `FK_verification_admin`',
    );
    await queryRunner.query(
      'ALTER TABLE `verification` DROP FOREIGN KEY `FK_verification_patient_profile`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_verification_admin` ON `verification`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_verification_patient_latest` ON `verification`',
    );

    await queryRunner.query(
      'ALTER TABLE `appointment` DROP FOREIGN KEY `FK_appointment_class`',
    );
    await queryRunner.query(
      'ALTER TABLE `appointment` DROP FOREIGN KEY `FK_appointment_eps`',
    );
    await queryRunner.query(
      'ALTER TABLE `appointment` DROP FOREIGN KEY `FK_appointment_specialty`',
    );
    await queryRunner.query(
      'ALTER TABLE `appointment` DROP FOREIGN KEY `FK_appointment_doctor`',
    );
    await queryRunner.query(
      'ALTER TABLE `appointment` DROP FOREIGN KEY `FK_appointment_patient_profile`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_appointment_class` ON `appointment`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_appointment_eps` ON `appointment`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_appointment_date_status_time` ON `appointment`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_appointment_specialty_waitlist` ON `appointment`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_appointment_patient_date` ON `appointment`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_appointment_doctor_date_time` ON `appointment`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_appointment_doctor_date_status` ON `appointment`',
    );

    await queryRunner.query(
      'CREATE INDEX `FK_ca9d7be1f6af3da02becdfa715c` ON `doctor` (`especialidadId`)',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_doctor_specialty_active_id` ON `doctor`',
    );
    await queryRunner.query(
      'ALTER TABLE `doctor` DROP FOREIGN KEY `FK_doctor_user`',
    );
    await queryRunner.query(
      'ALTER TABLE `doctor` DROP INDEX `UQ_doctor_medical_registration`',
    );
    await queryRunner.query(
      'ALTER TABLE `doctor` DROP INDEX `UQ_doctor_user_id`',
    );

    await queryRunner.query(
      'ALTER TABLE `patient` DROP FOREIGN KEY `FK_patient_user`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_patient_document_number` ON `patient`',
    );
    await queryRunner.query(
      'ALTER TABLE `patient` DROP INDEX `UQ_patient_document_type_number`',
    );
    await queryRunner.query(
      'ALTER TABLE `patient` DROP INDEX `UQ_patient_user_id`',
    );
  }

  private async assertCompatibleData(queryRunner: QueryRunner): Promise<void> {
    const checks: Array<[string, string]> = [
      ['Patient.userId duplicado', 'SELECT COUNT(*) count FROM (SELECT `userId` FROM `patient` GROUP BY `userId` HAVING COUNT(*) > 1) duplicates'],
      ['Documento de paciente duplicado', 'SELECT COUNT(*) count FROM (SELECT `tipoDocumento`, `numeroDocumento` FROM `patient` GROUP BY `tipoDocumento`, `numeroDocumento` HAVING COUNT(*) > 1) duplicates'],
      ['Patient.userId huérfano', 'SELECT COUNT(*) count FROM `patient` p LEFT JOIN `user` u ON u.id = p.userId WHERE u.id IS NULL'],
      ['Doctor.userId duplicado', 'SELECT COUNT(*) count FROM (SELECT `userId` FROM `doctor` GROUP BY `userId` HAVING COUNT(*) > 1) duplicates'],
      ['Registro médico duplicado', 'SELECT COUNT(*) count FROM (SELECT `registroMedico` FROM `doctor` WHERE `registroMedico` IS NOT NULL GROUP BY `registroMedico` HAVING COUNT(*) > 1) duplicates'],
      ['Doctor.userId huérfano', 'SELECT COUNT(*) count FROM `doctor` d LEFT JOIN `user` u ON u.id = d.userId WHERE u.id IS NULL'],
      ['Cita sin perfil de paciente', 'SELECT COUNT(*) count FROM `appointment` a LEFT JOIN `patient` p ON p.userId = a.patientId WHERE p.id IS NULL'],
      ['Cita con doctor huérfano', 'SELECT COUNT(*) count FROM `appointment` a LEFT JOIN `doctor` d ON d.id = a.doctorId WHERE a.doctorId IS NOT NULL AND d.id IS NULL'],
      ['Cita con especialidad huérfana', 'SELECT COUNT(*) count FROM `appointment` a LEFT JOIN `specialty` s ON s.id = a.specialtyId WHERE a.specialtyId IS NOT NULL AND s.id IS NULL'],
      ['Cita con EPS huérfana', 'SELECT COUNT(*) count FROM `appointment` a LEFT JOIN `eps` e ON e.id = a.epsId WHERE a.epsId IS NOT NULL AND e.id IS NULL'],
      ['Cita con clase huérfana', 'SELECT COUNT(*) count FROM `appointment` a LEFT JOIN `appointment_class` c ON c.id = a.appointmentClassId WHERE a.appointmentClassId IS NOT NULL AND c.id IS NULL'],
      ['Verificación sin perfil de paciente', 'SELECT COUNT(*) count FROM `verification` v LEFT JOIN `patient` p ON p.userId = v.patientId WHERE p.id IS NULL'],
      ['Verificación con administrador huérfano', 'SELECT COUNT(*) count FROM `verification` v LEFT JOIN `user` u ON u.id = v.adminId WHERE v.adminId IS NOT NULL AND u.id IS NULL'],
      ['Código de correo con usuario huérfano', 'SELECT COUNT(*) count FROM `email_verification_code` c LEFT JOIN `user` u ON u.id = c.userId WHERE u.id IS NULL'],
      ['Código de recuperación con usuario huérfano', 'SELECT COUNT(*) count FROM `password_reset_codes` c LEFT JOIN `user` u ON u.id = c.userId WHERE u.id IS NULL'],
    ];

    for (const [label, sql] of checks) {
      const rows = (await queryRunner.query(sql)) as Array<{
        count: string | number;
      }>;

      if (Number(rows[0]?.count ?? 0) > 0) {
        throw new Error(
          `No se puede aplicar la migración de integridad: ${label}`,
        );
      }
    }
  }
}
