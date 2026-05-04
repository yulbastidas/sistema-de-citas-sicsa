// src/appointments/appointments.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
})
export class AppointmentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // ─── Citas ────────────────────────────────────────────
  emitAppointmentCreated(data: unknown) {
    this.server.emit('appointmentCreated', data);
  }

  emitAppointmentUpdated(data: unknown) {
    this.server.emit('appointmentUpdated', data);
  }

  emitAppointmentCancelled(data: unknown) {
    this.server.emit('appointmentCancelled', data);
  }

  emitQueueUpdated(data: unknown) {
    this.server.emit('queueUpdated', data);
  }

  // ─── Verificaciones ───────────────────────────────────
  // el paciente solicitó verificación → avisa al admin en tiempo real
  emitVerificationRequested(data: unknown) {
    this.server.emit('verificationRequested', data);
  }

  //  admin aprobó o rechazó → avisa al paciente en tiempo real
  emitVerificationUpdated(data: unknown) {
    this.server.emit('verificationUpdated', data);
  }
}
