import { SocketAuthService } from './socket-auth.service';

describe('SocketAuthService', () => {
  const jwt = { verifyAsync: jest.fn() };
  const users = { findOne: jest.fn() };
  const doctors = { findOne: jest.fn() };
  const service = new SocketAuthService(
    jwt as never,
    users as never,
    doctors as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects a connection without a JWT', async () => {
    await expect(
      service.authenticate({ data: {}, handshake: { auth: {} } } as never),
    ).rejects.toThrow('Socket no autorizado');
  });

  it('rejects an invalid or expired JWT', async () => {
    jwt.verifyAsync.mockRejectedValueOnce(new Error('invalid'));
    await expect(
      service.authenticate({ data: {}, handshake: { auth: { token: 'bad' } } } as never),
    ).rejects.toThrow();
  });

  it('rejects an old tokenVersion', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: 7,
      role: 'patient',
      tokenVersion: 1,
    });
    users.findOne.mockResolvedValue({
      id: 7,
      role: 'patient',
      tokenVersion: 2,
    });
    await expect(
      service.authenticate({
        data: {},
        handshake: { auth: { token: 'Bearer jwt' } },
      } as never),
    ).rejects.toThrow('Socket no autorizado');
  });

  it('derives the doctor room identity from the database', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: 9,
      role: 'doctor',
      tokenVersion: 3,
      exp: 2_000_000_000,
    });
    users.findOne.mockResolvedValue({ id: 9, role: 'doctor', tokenVersion: 3 });
    doctors.findOne.mockResolvedValue({ id: 44 });
    await expect(
      service.authenticate({ data: {}, handshake: { auth: { token: 'jwt' } } } as never),
    ).resolves.toEqual({
      userId: 9,
      role: 'doctor',
      doctorId: 44,
      expiresAt: 2_000_000_000_000,
    });
  });
});
