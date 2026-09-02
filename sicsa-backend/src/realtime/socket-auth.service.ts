import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { Doctor } from '../doctors/entities/doctor.entity';
import { User } from '../users/entities/user.entity';

interface SocketJwtPayload {
  sub: number;
  role: User['role'];
  tokenVersion?: number;
  exp?: number;
}

export interface AuthenticatedSocketIdentity {
  userId: number;
  role: User['role'];
  doctorId?: number;
  expiresAt?: number;
}

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Doctor) private readonly doctors: Repository<Doctor>,
  ) {}

  async authenticate(client: Socket): Promise<AuthenticatedSocketIdentity> {
    const socketData = client.data as {
      identity?: AuthenticatedSocketIdentity;
    };
    if (socketData.identity) {
      return socketData.identity;
    }
    const token = this.extractToken(client.handshake.auth?.token);
    const payload = await this.jwtService.verifyAsync<SocketJwtPayload>(token);
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: { id: true, role: true, tokenVersion: true },
    });

    if (
      !user ||
      user.role !== payload.role ||
      (payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)
    ) {
      throw new UnauthorizedException('Socket no autorizado');
    }

    if (user.role === 'doctor') {
      const doctor = await this.doctors.findOne({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!doctor) throw new UnauthorizedException('Socket no autorizado');
      return {
        userId: user.id,
        role: user.role,
        doctorId: doctor.id,
        expiresAt: payload.exp ? payload.exp * 1000 : undefined,
      };
    }

    return {
      userId: user.id,
      role: user.role,
      expiresAt: payload.exp ? payload.exp * 1000 : undefined,
    };
  }

  private extractToken(raw: unknown): string {
    if (typeof raw !== 'string' || raw.trim() === '') {
      throw new UnauthorizedException('Socket no autorizado');
    }
    const token = raw.trim().replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Socket no autorizado');
    return token;
  }
}
