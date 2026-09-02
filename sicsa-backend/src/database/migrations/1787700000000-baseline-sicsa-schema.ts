import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineSicsaSchema1787700000000 implements MigrationInterface {
  name = 'BaselineSicsaSchema1787700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`user\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`email\` varchar(255) NOT NULL,
      \`password\` varchar(255) NOT NULL,
      \`role\` varchar(255) NOT NULL,
      \`emailVerified\` tinyint NOT NULL DEFAULT 0,
      \`canViewReports\` tinyint NOT NULL DEFAULT 0,
      UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`specialty\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`nombre\` varchar(255) NOT NULL,
      \`descripcion\` text NULL,
      \`activa\` tinyint NOT NULL DEFAULT 1,
      UNIQUE INDEX \`IDX_93628f8c4f3f2f51903df8372b\` (\`nombre\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`eps\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`nombre\` varchar(150) NOT NULL,
      \`activo\` tinyint NOT NULL DEFAULT 1,
      UNIQUE INDEX \`IDX_e05d704e872abcc5e6f3980155\` (\`nombre\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`appointment_class\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`nombre\` varchar(150) NOT NULL,
      \`activo\` tinyint NOT NULL DEFAULT 1,
      UNIQUE INDEX \`IDX_5af3050d70fe559b78179665b0\` (\`nombre\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`patient\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`userId\` int NOT NULL,
      \`tipoDocumento\` varchar(255) NOT NULL,
      \`numeroDocumento\` varchar(255) NOT NULL,
      \`primerNombre\` varchar(255) NOT NULL,
      \`segundoNombre\` varchar(255) NULL,
      \`primerApellido\` varchar(255) NOT NULL,
      \`segundoApellido\` varchar(255) NULL,
      \`telefono\` varchar(255) NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`eps\` varchar(255) NOT NULL,
      \`epsId\` int NULL,
      \`genero\` varchar(255) NULL,
      \`fechaNacimiento\` varchar(255) NULL,
      \`departamento\` varchar(255) NULL,
      \`municipio\` varchar(255) NULL,
      \`direccion\` varchar(255) NULL,
      \`tipoSangre\` varchar(255) NULL,
      \`factorRh\` varchar(255) NULL,
      \`alergias\` text NULL,
      \`enfermedadesCronicas\` text NULL,
      \`contactoEmergenciaNombre\` varchar(255) NULL,
      \`contactoEmergenciaTelefono\` varchar(255) NULL,
      \`contactoEmergenciaParentesco\` varchar(255) NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`doctor\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`userId\` int NOT NULL,
      \`nombre\` varchar(255) NOT NULL,
      \`especialidadId\` int NOT NULL,
      \`registroMedico\` varchar(255) NULL,
      \`consultorio\` varchar(255) NULL,
      \`activo\` tinyint NOT NULL DEFAULT 1,
      INDEX \`FK_ca9d7be1f6af3da02becdfa715c\` (\`especialidadId\`),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`FK_ca9d7be1f6af3da02becdfa715c\` FOREIGN KEY (\`especialidadId\`) REFERENCES \`specialty\`(\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`appointment\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`patientId\` int NOT NULL,
      \`doctorId\` int NULL,
      \`specialtyId\` int NULL,
      \`fecha\` varchar(255) NOT NULL,
      \`hora\` varchar(255) NOT NULL,
      \`estado\` varchar(255) NOT NULL DEFAULT 'confirmada',
      \`motivoConsulta\` text NULL,
      \`edad\` int NULL,
      \`embarazada\` tinyint NOT NULL DEFAULT 0,
      \`discapacidad\` tinyint NOT NULL DEFAULT 0,
      \`dolorIntenso\` tinyint NOT NULL DEFAULT 0,
      \`sangrado\` tinyint NOT NULL DEFAULT 0,
      \`dificultadRespiratoria\` tinyint NOT NULL DEFAULT 0,
      \`fiebre\` tinyint NOT NULL DEFAULT 0,
      \`prioridad\` varchar(255) NOT NULL DEFAULT 'baja',
      \`scorePrioridad\` int NOT NULL DEFAULT 0,
      \`explicacionPrioridad\` text NULL,
      \`eps\` varchar(255) NULL,
      \`epsId\` int NULL,
      \`departamento\` varchar(255) NULL,
      \`municipio\` varchar(255) NULL,
      \`appointmentClassId\` int NULL,
      \`observaciones\` text NULL,
      \`ordenMedicaUrl\` varchar(255) NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`verification\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`patientId\` int NOT NULL,
      \`documento\` varchar(50) NOT NULL,
      \`eps\` varchar(100) NOT NULL,
      \`estado\` varchar(30) NOT NULL DEFAULT 'pendiente',
      \`motivoRechazo\` varchar(255) NULL,
      \`adminId\` int NULL,
      \`fechaExpiracion\` datetime NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`email_verification_code\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`userId\` int NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`code\` varchar(255) NOT NULL,
      \`used\` tinyint NOT NULL DEFAULT 0,
      \`expiresAt\` datetime NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`password_reset_codes\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`userId\` int NOT NULL,
      \`email\` varchar(150) NOT NULL,
      \`codeHash\` varchar(255) NOT NULL,
      \`used\` tinyint NOT NULL DEFAULT 0,
      \`expiresAt\` datetime NOT NULL,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      INDEX \`IDX_3a2204bbed360cd62320bf0c77\` (\`email\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await queryRunner.query(`CREATE TABLE \`medical_reports\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`appointmentId\` int NOT NULL,
      \`motivoConsulta\` text NULL,
      \`enfermedadActual\` text NULL,
      \`antecedentes\` text NULL,
      \`signosVitales\` text NULL,
      \`antecedentesPersonales\` text NULL,
      \`antecedentesFamiliares\` text NULL,
      \`antecedentesQuirurgicos\` text NULL,
      \`antecedentesAlergicos\` text NULL,
      \`antecedentesFarmacologicos\` text NULL,
      \`presionArterial\` varchar(20) NULL,
      \`frecuenciaCardiaca\` varchar(20) NULL,
      \`frecuenciaRespiratoria\` varchar(20) NULL,
      \`temperatura\` varchar(20) NULL,
      \`saturacionOxigeno\` varchar(20) NULL,
      \`peso\` varchar(20) NULL,
      \`talla\` varchar(20) NULL,
      \`imc\` varchar(20) NULL,
      \`examenFisico\` text NULL,
      \`diagnostico\` text NULL,
      \`codigoCie10\` varchar(30) NULL,
      \`tratamiento\` text NULL,
      \`recomendaciones\` text NULL,
      \`remision\` text NULL,
      \`observaciones\` text NULL,
      \`firmaDoctor\` text NULL,
      UNIQUE INDEX \`IDX_b4cf30f26e44efcaa424970e04\` (\`appointmentId\`),
      UNIQUE INDEX \`REL_b4cf30f26e44efcaa424970e04\` (\`appointmentId\`),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`FK_b4cf30f26e44efcaa424970e04d\` FOREIGN KEY (\`appointmentId\`) REFERENCES \`appointment\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `medical_reports`');
    await queryRunner.query('DROP TABLE `password_reset_codes`');
    await queryRunner.query('DROP TABLE `email_verification_code`');
    await queryRunner.query('DROP TABLE `verification`');
    await queryRunner.query('DROP TABLE `appointment`');
    await queryRunner.query('DROP TABLE `doctor`');
    await queryRunner.query('DROP TABLE `patient`');
    await queryRunner.query('DROP TABLE `appointment_class`');
    await queryRunner.query('DROP TABLE `eps`');
    await queryRunner.query('DROP TABLE `specialty`');
    await queryRunner.query('DROP TABLE `user`');
  }
}
