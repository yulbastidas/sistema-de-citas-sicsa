import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getCorsOrigins } from '../config/environment';
import {
  AuthenticatedSocketIdentity,
  SocketAuthService,
} from '../realtime/socket-auth.service';

interface VerificationSocketSource {
  id: number;
  patientId: number;
  estado: string;
}

@WebSocketGateway({
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
})
export class VerificationsGateway
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
      await client.join(`patient:${identity.userId}`);
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

  emitVerificationRequested(source: VerificationSocketSource): void {
    this.server.to('admins').emit('verificationRequested', {
      event: 'verificationRequested',
      verificationId: source.id,
      estado: source.estado,
    });
  }

  emitVerificationUpdated(source: VerificationSocketSource): void {
    const payload = {
      event: 'verificationUpdated',
      verificationId: source.id,
      estado: source.estado,
    };
    this.server.to('admins').emit('verificationUpdated', payload);
    this.server
      .to(`patient:${source.patientId}`)
      .emit('verificationUpdated', payload);
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
