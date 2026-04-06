import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';

interface JwtUser {
  sub: number;
  email: string;
  role: string | number;
}

type RequestWithUser = Request & {
  user: JwtUser;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private normalizeRole(role: string | number): string {
    if (role === 1 || role === '1') return 'admin';
    if (role === 2 || role === '2') return 'patient';
    if (role === 3 || role === '3') return 'doctor';
    return String(role);
  }

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return false;
    }

    const normalizedUserRole = this.normalizeRole(user.role);

    return roles.includes(normalizedUserRole);
  }
}
