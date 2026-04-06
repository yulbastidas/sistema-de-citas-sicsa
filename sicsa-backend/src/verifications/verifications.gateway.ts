import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class VerificationsGateway {
  @WebSocketServer()
  server!: Server;

  emitVerificationRequested(payload: unknown) {
    this.server.emit('verificationRequested', payload);
  }

  emitVerificationUpdated(payload: unknown) {
    this.server.emit('verificationUpdated', payload);
  }
}
