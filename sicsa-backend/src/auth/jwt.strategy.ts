import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  ExtractJwt,
} from 'passport-jwt';
import * as dotenv from 'dotenv';

dotenv.config();

interface JwtPayload {
  sub: number;
  email: string;
  role: string | number;
  emailVerified: boolean;
  canViewReports: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor() {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        process.env.JWT_SECRET || 'dev_secret_only',
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      emailVerified: payload.emailVerified,
      canViewReports:
        payload.canViewReports === true,
    };
  }
}