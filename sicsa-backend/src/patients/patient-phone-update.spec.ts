import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { User } from '../users/entities/user.entity';

describe('Patient contact phone compatibility', () => {
  it('updates telefono without changing verified phone security fields', async () => {
    const patient = {
      id: 1,
      userId: 7,
      telefono: '3000000000',
      verifiedPhoneE164: '+573009999999',
      phoneVerifiedAt: new Date('2026-08-01T12:00:00Z'),
      phoneChangedAt: new Date('2026-08-01T12:00:00Z'),
    } as Patient;
    const patientRepository = {
      findOne: jest.fn().mockResolvedValue(patient),
      save: jest.fn((value: Patient) => Promise.resolve(value)),
    };
    const userRepository = { findOne: jest.fn() };
    const dataSource = {
      transaction: jest.fn(async (work: (manager: unknown) => unknown) =>
        work({
          getRepository: (entity: unknown) =>
            entity === Patient ? patientRepository : userRepository,
        }),
      ),
    };
    const service = new PatientsService(
      patientRepository as never,
      userRepository as never,
      dataSource as never,
    );

    await expect(
      service.updateMyProfile(7, { telefono: '3101234567' }),
    ).resolves.toMatchObject({
      patient: {
        telefono: '3101234567',
        verifiedPhoneE164: '+573009999999',
        phoneVerifiedAt: new Date('2026-08-01T12:00:00Z'),
        phoneChangedAt: new Date('2026-08-01T12:00:00Z'),
      },
    });
  });
});
