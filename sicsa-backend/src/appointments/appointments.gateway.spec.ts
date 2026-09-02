/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { AppointmentsGateway } from './appointments.gateway';

describe('AppointmentsGateway rooms', () => {
  const to = jest.fn();
  const emit = jest.fn();
  const gateway = new AppointmentsGateway({ authenticate: jest.fn() } as never);

  beforeEach(() => {
    jest.clearAllMocks();
    to.mockReturnValue({ emit });
    gateway.server = { to } as never;
  });

  it('emits a minimal appointment payload only to owner, doctor and admins', () => {
    gateway.emitAppointmentCreated({
      id: 10,
      patientId: 20,
      doctorId: 30,
      specialtyId: 40,
      fecha: '2026-09-01',
      hora: '08:00',
      estado: 'confirmada',
    });
    expect(to.mock.calls.map(([room]) => room)).toEqual([
      'admins',
      'patient:20',
      'doctor:30',
    ]);
    const payload = emit.mock.calls[0][1];
    expect(payload).toEqual({
      event: 'appointmentCreated',
      appointmentId: 10,
      estado: 'confirmada',
      fecha: '2026-09-01',
      hora: '08:00',
      doctorId: 30,
      specialtyId: 40,
    });
    expect(payload).not.toHaveProperty('patient');
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('telefono');
    expect(payload).not.toHaveProperty('motivoConsulta');
  });

  it('does not emit an event for patient A to patient B', () => {
    gateway.emitAppointmentCancelled({
      id: 1,
      patientId: 100,
      doctorId: 3,
      fecha: '2026-09-01',
      hora: '09:00',
      estado: 'cancelada',
    });
    expect(to).toHaveBeenCalledWith('patient:100');
    expect(to).not.toHaveBeenCalledWith('patient:101');
  });

  it.each([
    [{ role: 'patient', userId: 20 }, 'patient:20'],
    [{ role: 'doctor', userId: 9, doctorId: 30 }, 'doctor:30'],
    [{ role: 'admin', userId: 1 }, 'admins'],
  ])(
    'joins only the room derived from the authenticated identity',
    async (identity, expectedRoom) => {
      const client = { data: { identity }, join: jest.fn() };
      await gateway.handleConnection(client as never);
      expect(client.join).toHaveBeenCalledTimes(1);
      expect(client.join).toHaveBeenCalledWith(expectedRoom);
    },
  );
});
