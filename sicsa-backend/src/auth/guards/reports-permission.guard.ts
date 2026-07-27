import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface AuthenticatedUser {
  id?: number;
  sub?: number;
  email?: string;
  role?: string;
  emailVerified?: boolean;
  canViewReports?: boolean;
}

@Injectable()
export class ReportsPermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'No se encontró la información del usuario autenticado',
      );
    }

    if (user.role !== 'admin' || user.canViewReports !== true) {
      throw new ForbiddenException(
        'No tienes permiso para consultar estadísticas y reportes',
      );
    }

    return true;
  }
}