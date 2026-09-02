import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as dotenv from 'dotenv';
import { getJwtSecret } from '../config/environment';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

dotenv.config();

interface JwtPayload {
  sub: number;
  email: string;
  role: string | number;
  emailVerified: boolean;
  canViewReports: boolean;
  tokenVersion?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findOne({ where: { id: payload.sub }, select: { id: true, tokenVersion: true } });
    if (!user || (payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) throw new UnauthorizedException('Sesión inválida');
    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      emailVerified: payload.emailVerified,
      canViewReports: payload.canViewReports === true,
    };
  }
}
