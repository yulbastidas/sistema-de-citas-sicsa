/* eslint-disable @typescript-eslint/no-unsafe-return */
import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('persists a minimal event and removes sensitive metadata', async () => {
    const repository = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue({}),
    };
    const service = new AuditService(repository as never);
    await service.record({
      actorUserId: 2,
      actorRole: 'doctor',
      action: 'medical_report.accessed',
      resourceType: 'appointment',
      resourceId: 8,
      result: 'success',
      metadata: { appointmentId: 8, password: 'never', otpCode: 'never' },
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 2,
        resourceId: '8',
        metadata: { appointmentId: 8 },
      }),
    );
  });

  it('does not fail the main operation when persistence fails', async () => {
    const repository = {
      create: jest.fn((value) => value),
      save: jest.fn().mockRejectedValue(new Error('database unavailable')),
    };
    const service = new AuditService(repository as never);
    await expect(
      service.record({
        actorRole: 'system',
        action: 'test',
        resourceType: 'test',
        result: 'failure',
      }),
    ).resolves.toBeUndefined();
  });
});
