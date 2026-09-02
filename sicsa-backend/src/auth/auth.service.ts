import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { EmailVerificationCode } from './entities/email-verification-code.entity';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Eps } from '../eps/entities/eps.entity';
import { normalizeColombianPhone } from '../patients/security/colombian-phone';
import { MfaService } from './mfa.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,

    @InjectRepository(EmailVerificationCode)
    private readonly emailCodeRepo: Repository<EmailVerificationCode>,

    @InjectRepository(PasswordResetCode)
    private readonly passwordResetCodeRepo: Repository<PasswordResetCode>,

    @InjectRepository(Eps)
    private readonly epsRepo: Repository<Eps>,
    private readonly mfaService: MfaService,
  ) {}

  private normalizeRole(role: string | number): string {
    if (role === 1 || role === '1') return 'admin';
    if (role === 2 || role === '2') return 'patient';
    if (role === 3 || role === '3') return 'doctor';

    return String(role);
  }

  private normalizeEmail(emailRaw: string): string {
    if (!emailRaw || typeof emailRaw !== 'string') {
      throw new BadRequestException('Correo inválido');
    }

    const email = emailRaw.trim().toLowerCase();

    if (!email || email.length > 150) {
      throw new BadRequestException('Correo inválido');
    }

    return email;
  }

  private normalizeText(value: string | undefined | null): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    return value.trim();
  }

  private generateCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private getN8nTimeoutMs(): number {
    const configured = Number(process.env.N8N_TIMEOUT_MS || 5000);
    return Number.isFinite(configured) && configured > 0 ? configured : 5000;
  }

  private async sendCodeToN8n(email: string, code: string): Promise<void> {
    const webhookUrl = process.env.N8N_VERIFICATION_CODE_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new BadRequestException(
        'No está configurada la URL de verificación de n8n',
      );
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `email-verification:${email}:${code}`,
      },
      signal: AbortSignal.timeout(this.getN8nTimeoutMs()),
      body: JSON.stringify({
        email,
        code,
        idempotencyKey: `email-verification:${email}:${code}`,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('Error enviando correo con n8n');
    }
  }

  private async sendPasswordResetCodeToN8n(
    email: string,
    code: string,
  ): Promise<void> {
    const webhookUrl = process.env.N8N_PASSWORD_RESET_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new BadRequestException(
        'No está configurada la URL de recuperación de contraseña',
      );
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `password-reset:${email}:${code}`,
      },
      signal: AbortSignal.timeout(this.getN8nTimeoutMs()),
      body: JSON.stringify({
        email,
        code,
        purpose: 'password-reset',
        expiresInMinutes: 10,
        idempotencyKey: `password-reset:${email}:${code}`,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(
        'No fue posible enviar el código de recuperación',
      );
    }
  }

  private async createEmailVerificationCode(user: User): Promise<string> {
    await this.emailCodeRepo.update(
      {
        email: user.email,
        used: false,
      },
      {
        used: true,
      },
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

  private async createPasswordResetCode(user: User): Promise<string> {
    await this.passwordResetCodeRepo.update(
      {
        email: user.email,
        used: false,
      },
      {
        used: true,
      },
    );

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const resetCode = this.passwordResetCodeRepo.create({
      userId: user.id,
      email: user.email,
      codeHash,
      used: false,
      expiresAt,
    });

    await this.passwordResetCodeRepo.save(resetCode);

    return code;
  }

  private async findValidPasswordResetCode(
    email: string,
    code: string,
  ): Promise<PasswordResetCode> {
    const resetCodes = await this.passwordResetCodeRepo.find({
      where: {
        email,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
      take: 5,
    });

    for (const resetCode of resetCodes) {
      const codeMatches = await bcrypt.compare(code, resetCode.codeHash);

      if (codeMatches) {
        return resetCode;
      }
    }

    throw new BadRequestException('El código es inválido o ha expirado');
  }

  async register(data: RegisterDto) {
    const email = this.normalizeEmail(data.email);
    const numeroDocumento = this.normalizeText(data.numeroDocumento);

    const eps = await this.epsRepo.findOne({
      where: {
        id: data.epsId,
        activo: true,
      },
    });

    if (!eps) {
      throw new BadRequestException(
        'La EPS seleccionada no existe o no está activa',
      );
    }

    if (
      eps.nombre.trim().toLocaleLowerCase('es-CO') !==
      data.eps.trim().toLocaleLowerCase('es-CO')
    ) {
      throw new BadRequestException(
        'El nombre de la EPS no corresponde a la EPS seleccionada',
      );
    }

    const existingUser = await this.userRepo.findOne({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const existingPatient = await this.patientRepo.findOne({
      where: {
        numeroDocumento,
      },
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
      tipoDocumento: this.normalizeText(data.tipoDocumento),
      numeroDocumento,
      primerNombre: this.normalizeText(data.primerNombre),
      segundoNombre: this.normalizeText(data.segundoNombre),
      primerApellido: this.normalizeText(data.primerApellido),
      segundoApellido: this.normalizeText(data.segundoApellido),
      telefono: this.normalizeText(data.telefono),
      email,
      eps: eps.nombre,
      epsId: eps.id,
      genero: this.normalizeText(data.genero),
      fechaNacimiento: data.fechaNacimiento,
      departamento: this.normalizeText(data.departamento),
      municipio: this.normalizeText(data.municipio),
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
    const email = this.normalizeEmail(emailRaw);

    const user = await this.userRepo.findOne({
      where: {
        email,
      },
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

  async verifyEmailCode(emailRaw: string, codeRaw: string) {
    const email = this.normalizeEmail(emailRaw);
    const code = this.normalizeText(codeRaw);

    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Código inválido');
    }

    const user = await this.userRepo.findOne({
      where: {
        email,
      },
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

  async forgotPassword(emailRaw: string) {
    const email = this.normalizeEmail(emailRaw);

    const genericResponse = {
      message:
        'Si el correo está registrado, recibirás un código para recuperar tu contraseña.',
    };

    const user = await this.userRepo.findOne({
      where: {
        email,
      },
    });

    /*
     * Por seguridad no se informa si el correo existe o no.
     * Esto evita que alguien pueda consultar qué usuarios
     * están registrados en el sistema.
     */
    if (
      !user ||
      (this.normalizeRole(user.role) === 'patient' && !user.emailVerified)
    ) {
      return genericResponse;
    }

    const code = await this.createPasswordResetCode(user);

    await this.sendPasswordResetCodeToN8n(user.email, code);

    return genericResponse;
  }

  async verifyResetCode(emailRaw: string, codeRaw: string) {
    const email = this.normalizeEmail(emailRaw);
    const code = this.normalizeText(codeRaw);

    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('El código debe contener seis números');
    }

    const user = await this.userRepo.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('El código es inválido o ha expirado');
    }

    await this.findValidPasswordResetCode(email, code);

    return {
      message: 'Código verificado correctamente',
      valid: true,
    };
  }

  async resetPassword(
    emailRaw: string,
    codeRaw: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const email = this.normalizeEmail(emailRaw);
    const code = this.normalizeText(codeRaw);

    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('El código debe contener seis números');
    }

    if (!newPassword || typeof newPassword !== 'string') {
      throw new BadRequestException('La nueva contraseña es obligatoria');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException(
        'La contraseña debe tener al menos ocho caracteres',
      );
    }

    const user = await this.userRepo.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('El código es inválido o ha expirado');
    }

    const resetCode = await this.findValidPasswordResetCode(email, code);

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;

    await this.userRepo.save(user);

    resetCode.used = true;
    await this.passwordResetCodeRepo.save(resetCode);

    /*
     * Invalida cualquier otro código de recuperación
     * pendiente para el mismo correo.
     */
    await this.passwordResetCodeRepo.update(
      {
        email,
        used: false,
      },
      {
        used: true,
      },
    );

    return {
      message:
        'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
      passwordUpdated: true,
    };
  }

  async login(identifierRaw: string, password: string) {
    if (!password || typeof password !== 'string') {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const identifier = identifierRaw?.trim().toLowerCase();
    const user = await this.findLoginUser(identifier);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const normalizedRole = this.normalizeRole(user.role);
    if (normalizedRole === 'doctor' || normalizedRole === 'admin') {
      return this.mfaService.begin(user);
    }

    return this.issueAccessToken(user);
  }

  async completeMfaLogin(challengeToken: string, method: 'totp' | 'recovery', code: string) {
    const result = await this.mfaService.complete(challengeToken, method, code);
    const role = this.normalizeRole(result.user.role);
    if (role !== 'doctor' && role !== 'admin') throw new UnauthorizedException('Código de verificación inválido o expirado');
    return { ...this.issueAccessToken(result.user), recoveryCodes: result.recoveryCodes };
  }

  async regenerateRecoveryCodes(userId: number, code: string) {
    return { recoveryCodes: await this.mfaService.regenerate(userId, code) };
  }

  private issueAccessToken(user: User) {
    const normalizedRole = this.normalizeRole(user.role);
    const payload = {
      sub: user.id,
      email: user.email,
      role: normalizedRole,
      emailVerified: user.emailVerified,
      canViewReports: user.canViewReports === true,
      tokenVersion: user.tokenVersion ?? 0,
    };

    return {
      message: 'Login exitoso',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: normalizedRole,
        emailVerified: user.emailVerified,
        canViewReports: user.canViewReports === true,
      },
    };
  }

  private async findLoginUser(identifier: string | undefined) {
    if (!identifier) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (identifier.includes('@')) {
      try {
        return await this.usersService.findByEmail(identifier);
      } catch {
        throw new UnauthorizedException('Credenciales inválidas');
      }
    }

    let verifiedPhoneE164: string;

    try {
      verifiedPhoneE164 = normalizeColombianPhone(identifier);
    } catch {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const patient = await this.patientRepo.findOne({
      where: { verifiedPhoneE164 },
      select: { userId: true, verifiedPhoneE164: true },
    });

    if (!patient) {
      return null;
    }

    return this.userRepo.findOne({
      where: { id: patient.userId, role: 'patient' },
    });
  }
}
