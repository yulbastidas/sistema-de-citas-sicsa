import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private normalizeRole(role: string | number): string {
    if (role === 1 || role === '1') return 'admin';
    if (role === 2 || role === '2') return 'patient';
    if (role === 3 || role === '3') return 'doctor';
    return String(role);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.password !== password) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const normalizedRole = this.normalizeRole(user.role);

    const payload = {
      sub: user.id,
      email: user.email,
      role: normalizedRole,
    };

    return {
      message: 'Login exitoso',
      access_token: this.jwtService.sign(payload),
    };
  }
}
