/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import dataSource from './data-source';

const describeWithMysql =
  process.env.RUN_MYSQL_INTEGRATION === 'true' ? describe : describe.skip;

describeWithMysql('Relational integrity with MySQL', () => {
  beforeAll(async () => {
    await dataSource.initialize();
    await dataSource.query('DELETE FROM `appointment`');
    await dataSource.query('DELETE FROM `doctor`');
    await dataSource.query('DELETE FROM `patient`');
    await dataSource.query('DELETE FROM `specialty`');
    await dataSource.query('DELETE FROM `eps`');
    await dataSource.query('DELETE FROM `appointment_class`');
    await dataSource.query('DELETE FROM `user`');
    await dataSource.query(
      'INSERT INTO `user` (`id`, `email`, `password`, `role`, `emailVerified`, `canViewReports`, `tokenVersion`) VALUES (1, ?, ?, ?, 1, 0, 0), (2, ?, ?, ?, 1, 0, 0), (3, ?, ?, ?, 1, 0, 0), (4, ?, ?, ?, 1, 0, 0)',
      [
        'patient1@example.test',
        'hash',
        'patient',
        'patient2@example.test',
        'hash',
        'patient',
        'doctor3@example.test',
        'hash',
        'doctor',
        'doctor4@example.test',
        'hash',
        'doctor',
      ],
    );
    await dataSource.query(
      'INSERT INTO `specialty` (`id`, `nombre`, `activa`) VALUES (1, ?, 1)',
      ['Specialty test'],
    );
    await dataSource.query(
      'INSERT INTO `eps` (`id`, `nombre`, `activo`) VALUES (1, ?, 1)',
      ['EPS test'],
    );
    await dataSource.query(
      'INSERT INTO `appointment_class` (`id`, `nombre`, `activo`) VALUES (1, ?, 1)',
      ['Class test'],
    );
    await dataSource.query(
      'INSERT INTO `patient` (`userId`, `tipoDocumento`, `numeroDocumento`, `primerNombre`, `primerApellido`, `telefono`, `email`, `eps`, `epsId`) VALUES (1, ?, ?, ?, ?, ?, ?, ?, 1)',
      [
        'CC',
        'DOC-1',
        'Patient',
        'Test',
        '3000000001',
        'patient1@example.test',
        'EPS test',
      ],
    );
    await dataSource.query(
      'INSERT INTO `doctor` (`id`, `userId`, `nombre`, `especialidadId`, `registroMedico`, `activo`) VALUES (1, 3, ?, 1, ?, 1)',
      ['Doctor test', 'RM-1'],
    );
  });

  afterAll(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  const expectConstraintFailure = async (
    sql: string,
    parameters: unknown[],
  ) => {
    await expect(dataSource.query(sql, parameters)).rejects.toMatchObject({
      code: expect.stringMatching(/ER_DUP_ENTRY|ER_NO_REFERENCED_ROW_2/),
    });
  };

  it('rechaza duplicados y huérfanos de Patient', async () => {
    const insert =
      'INSERT INTO `patient` (`userId`, `tipoDocumento`, `numeroDocumento`, `primerNombre`, `primerApellido`, `telefono`, `email`, `eps`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    await expectConstraintFailure(insert, [
      1,
      'CC',
      'DOC-2',
      'Duplicate',
      'User',
      '3000000002',
      'duplicate-user@example.test',
      'EPS test',
    ]);
    await expectConstraintFailure(insert, [
      2,
      'CC',
      'DOC-1',
      'Duplicate',
      'Document',
      '3000000003',
      'duplicate-document@example.test',
      'EPS test',
    ]);
    await expectConstraintFailure(insert, [
      999,
      'CC',
      'DOC-999',
      'Orphan',
      'User',
      '3000000999',
      'orphan@example.test',
      'EPS test',
    ]);
  });

  it('rechaza duplicados y huérfanos de Doctor', async () => {
    const insert =
      'INSERT INTO `doctor` (`userId`, `nombre`, `especialidadId`, `registroMedico`, `activo`) VALUES (?, ?, ?, ?, 1)';
    await expectConstraintFailure(insert, [3, 'Duplicate user', 1, 'RM-2']);
    await expectConstraintFailure(insert, [4, 'Duplicate registration', 1, 'RM-1']);
    await expectConstraintFailure(insert, [4, 'Orphan specialty', 999, 'RM-4']);
  });

  it('rechaza relaciones huérfanas de Appointment', async () => {
    const insert =
      'INSERT INTO `appointment` (`patientId`, `doctorId`, `specialtyId`, `fecha`, `hora`, `epsId`, `appointmentClassId`) VALUES (?, ?, ?, ?, ?, ?, ?)';
    await expectConstraintFailure(insert, [999, 1, 1, '2099-09-15', '08:00', 1, 1]);
    await expectConstraintFailure(insert, [1, 999, 1, '2099-09-15', '08:00', 1, 1]);
    await expectConstraintFailure(insert, [1, 1, 999, '2099-09-15', '08:00', 1, 1]);
    await expectConstraintFailure(insert, [1, 1, 1, '2099-09-15', '08:00', 999, 1]);
    await expectConstraintFailure(insert, [1, 1, 1, '2099-09-15', '08:00', 1, 999]);
  });

  it('permite registros relacionalmente válidos', async () => {
    await expect(
      dataSource.query(
        'INSERT INTO `appointment` (`patientId`, `doctorId`, `specialtyId`, `fecha`, `hora`, `epsId`, `appointmentClassId`) VALUES (1, 1, 1, ?, ?, 1, 1)',
        ['2099-09-15', '08:00'],
      ),
    ).resolves.toBeDefined();
  });
});
