/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { VerificationsGateway } from './verifications.gateway';

describe('VerificationsGateway rooms', () => {
  it('notifies admins of requests and only the owning patient of updates', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const gateway = new VerificationsGateway({
      authenticate: jest.fn(),
    } as never);
    gateway.server = { to } as never;
    gateway.emitVerificationRequested({
      id: 1,
      patientId: 20,
      estado: 'pendiente',
    });
    gateway.emitVerificationUpdated({
      id: 1,
      patientId: 20,
      estado: 'aprobado',
    });
    expect(to.mock.calls.map(([room]) => room)).toEqual([
      'admins',
      'admins',
      'patient:20',
    ]);
    expect(to).not.toHaveBeenCalledWith('patient:21');
    for (const call of emit.mock.calls) {
      expect(call[1]).not.toHaveProperty('documento');
      expect(call[1]).not.toHaveProperty('eps');
    }
  });
});
