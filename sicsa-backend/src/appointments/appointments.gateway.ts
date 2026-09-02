// src/appointments/appointments.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getCorsOrigins } from '../config/environment';
import {
  AuthenticatedSocketIdentity,
  SocketAuthService,
} from '../realtime/socket-auth.service';

interface AppointmentSocketSource {
  id: number;
  patientId: number;
  doctorId?: number | null;
  specialtyId?: number | null;
  fecha: string;
  hora: string;
  estado: string;
}

interface QueueSocketSource {
  fecha: string;
  patientId?: number | null;
  doctorId?: number | null;
  message?: string;
}

@WebSocketGateway({
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
})
export class AppointmentsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(private readonly socketAuth: SocketAuthService) {}

  afterInit(server: Server): void {
    server.use((client, next) => {
      void this.socketAuth.authenticate(client).then(
        (identity) => {
          this.socketData(client).identity = identity;
          next();
        },
        () => next(new Error('Socket no autorizado')),
      );
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const identity = this.socketData(client).identity;
    if (!identity) {
      client.disconnect(true);
      return;
    }
    if (identity.role === 'patient') {
      await client.join(this.patientRoom(identity.userId));
    } else if (identity.role === 'doctor' && identity.doctorId) {
      await client.join(this.doctorRoom(identity.doctorId));
    } else if (identity.role === 'admin') {
      await client.join('admins');
    }
    this.scheduleExpiry(client, identity);
  }

  handleDisconnect(client: Socket): void {
    const timer = this.socketData(client).expiryTimer;
    if (timer) clearTimeout(timer);
    delete this.socketData(client).identity;
    delete this.socketData(client).expiryTimer;
  }

  // ─── Citas ────────────────────────────────────────────
  emitAppointmentCreated(data: AppointmentSocketSource): void {
    this.emitAppointment('appointmentCreated', data);
  }

  emitAppointmentUpdated(data: AppointmentSocketSource): void {
    this.emitAppointment('appointmentUpdated', data);
  }

  emitAppointmentCancelled(data: AppointmentSocketSource): void {
    this.emitAppointment('appointmentCancelled', data);
  }

  emitQueueUpdated(data: QueueSocketSource): void {
    const payload = { event: 'queueUpdated', fecha: data.fecha };
    this.server.to('admins').emit('queueUpdated', payload);
    if (data.patientId) {
      this.server
        .to(this.patientRoom(data.patientId))
        .emit('queueUpdated', payload);
    }
    if (data.doctorId) {
      this.server
        .to(this.doctorRoom(data.doctorId))
        .emit('queueUpdated', payload);
    }
  }

  private emitAppointment(event: string, data: AppointmentSocketSource): void {
    const payload = {
      event,
      appointmentId: data.id,
      estado: data.estado,
      fecha: data.fecha,
      hora: data.hora,
      doctorId: data.doctorId ?? null,
      specialtyId: data.specialtyId ?? null,
    };
    this.server.to('admins').emit(event, payload);
    this.server.to(this.patientRoom(data.patientId)).emit(event, payload);
    if (data.doctorId) {
      this.server.to(this.doctorRoom(data.doctorId)).emit(event, payload);
    }
  }

  private patientRoom(userId: number): string {
    return `patient:${userId}`;
  }

  private doctorRoom(doctorId: number): string {
    return `doctor:${doctorId}`;
  }

  private socketData(client: Socket): {
    identity?: AuthenticatedSocketIdentity;
    expiryTimer?: ReturnType<typeof setTimeout>;
  } {
    return client.data as {
      identity?: AuthenticatedSocketIdentity;
      expiryTimer?: ReturnType<typeof setTimeout>;
    };
  }

  private scheduleExpiry(
    client: Socket,
    identity: AuthenticatedSocketIdentity,
  ): void {
    const data = this.socketData(client);
    if (!identity.expiresAt || data.expiryTimer) return;
    const remaining = identity.expiresAt - Date.now();
    if (remaining <= 0) {
      client.disconnect(true);
      return;
    }
    data.expiryTimer = setTimeout(() => client.disconnect(true), remaining);
  }
}
