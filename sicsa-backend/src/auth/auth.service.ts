import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { EmailVerificationCode } from './entities/email-verification-code.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    @InjectRepository(EmailVerificationCode)
    private emailCodeRepo: Repository<EmailVerificationCode>,
  ) {}

  private normalizeRole(role: string | number): string {
    if (role === 1 || role === '1') return 'admin';
    if (role === 2 || role === '2') return 'patient';
    if (role === 3 || role === '3') return 'doctor';
    return String(role);
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendCodeToN8n(email: string, code: string): Promise<void> {
    const webhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new BadRequestException('No está configurada la URL de n8n');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        code,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('Error enviando correo con n8n');
    }
  }

  private async createEmailVerificationCode(user: User): Promise<string> {
    await this.emailCodeRepo.update(
      { email: user.email, used: false },
      { used: true },
    );

    const code = this.generateCode();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const verificationCode = this.emailCodeRepo.create({
      userId: user.id,
      email: user.email,
      code,
      used: false,
      expiresAt,
    });

    await this.emailCodeRepo.save(verificationCode);

    return code;
  }

  async register(data: RegisterDto) {
    const email = data.email.trim().toLowerCase();

    console.log('EMAIL RECIBIDO:', email);

    const existingUser = await this.userRepo.findOne({
      where: { email },
    });

    console.log('USUARIO ENCONTRADO:', existingUser);

    if (existingUser) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const existingPatient = await this.patientRepo.findOne({
      where: { numeroDocumento: data.numeroDocumento },
    });

    if (existingPatient) {
      throw new BadRequestException('El documento ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      role: 'patient',
      emailVerified: false,
    });

    const savedUser = await this.userRepo.save(user);

    const patient = this.patientRepo.create({
      userId: savedUser.id,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
      primerNombre: data.primerNombre,
      segundoNombre: data.segundoNombre ?? '',
      primerApellido: data.primerApellido,
      segundoApellido: data.segundoApellido ?? '',
      telefono: data.telefono,
      email,
      eps: data.eps,
      epsId: data.epsId,
      genero: data.genero,
      fechaNacimiento: data.fechaNacimiento,
      departamento: data.departamento,
      municipio: data.municipio,
    });

    await this.patientRepo.save(patient);

    const code = await this.createEmailVerificationCode(savedUser);
    await this.sendCodeToN8n(savedUser.email, code);

    return {
      message: 'Registro exitoso. Verifica tu correo.',
      userId: savedUser.id,
      email: savedUser.email,
      emailVerified: false,
    };
  }

  async sendVerificationCode(emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();

    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new BadRequestException('El correo ya fue verificado');
    }

    const code = await this.createEmailVerificationCode(user);
    await this.sendCodeToN8n(user.email, code);

    return {
      message: 'Código enviado correctamente',
      email: user.email,
    };
  }

  async verifyEmailCode(emailRaw: string, code: string) {
    const email = emailRaw.trim().toLowerCase();

    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const verificationCode = await this.emailCodeRepo.findOne({
      where: {
        email,
        code,
        used: false,
      },
      order: {
        id: 'DESC',
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Código inválido');
    }

    if (verificationCode.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('El código ha expirado');
    }

    verificationCode.used = true;
    await this.emailCodeRepo.save(verificationCode);

    user.emailVerified = true;
    await this.userRepo.save(user);

    return {
      message: 'Correo verificado correctamente',
      emailVerified: true,
    };
  }

  async login(emailRaw: string, password: string) {
    const email = emailRaw.trim().toLowerCase();

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const normalizedRole = this.normalizeRole(user.role);

    const payload = {
      sub: user.id,
      email: user.email,
      role: normalizedRole,
      emailVerified: user.emailVerified,
    };

    return {
      message: 'Login exitoso',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: normalizedRole,
        emailVerified: user.emailVerified,
      },
    };
  }
}
