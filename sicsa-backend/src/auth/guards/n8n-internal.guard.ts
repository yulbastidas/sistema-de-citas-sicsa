import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

@Injectable()
export class N8nInternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedToken = process.env.N8N_INTERNAL_TOKEN?.trim();

    if (!expectedToken) {
      throw new ServiceUnavailableException(
        'La autenticación del servicio interno no está configurada',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedHeader = request.headers['x-sicsa-internal-token'];
    const providedToken = Array.isArray(providedHeader)
      ? providedHeader[0]
      : providedHeader;

    if (!providedToken || !this.tokensMatch(providedToken, expectedToken)) {
      throw new ForbiddenException('Acceso interno no autorizado');
    }

    return true;
  }

  private tokensMatch(providedToken: string, expectedToken: string): boolean {
    const providedBuffer = Buffer.from(providedToken);
    const expectedBuffer = Buffer.from(expectedToken);

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  }
}
