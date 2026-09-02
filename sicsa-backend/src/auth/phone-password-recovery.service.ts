import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import {
  maskPhone,
  normalizeColombianPhone,
} from '../patients/security/colombian-phone';
import { User } from '../users/entities/user.entity';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import { OtpPurpose } from './otp/otp-purpose';
import { OtpService } from './otp/otp.service';

const GENERIC_MESSAGE =
  'Si los datos corresponden a una cuenta válida, recibirás un código de recuperación.';
const INVALID_CODE_MESSAGE = 'El código es inválido o ha expirado';

@Injectable()
export class PhonePasswordRecoveryService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly dataSource: DataSource,
  ) {}

  async request(phone: string, requestIp: string) {
    const phoneE164 = this.normalizePhone(phone);
    const user = await this.findVerifiedPatientUser(phoneE164);
    const generic = {
      message: GENERIC_MESSAGE,
      challengeId: randomUUID(),
      maskedPhone: maskPhone(phoneE164),
    };

    if (!user) return generic;

    let challenge: Awaited<ReturnType<OtpService['request']>>;
    try {
      challenge = await this.otpService.request({
        userId: user.id,
        phone: phoneE164,
        requestIp,
        purpose: OtpPurpose.PHONE_PASSWORD_RESET,
      });
    } catch {
      return generic;
    }

    return {
      ...generic,
      challengeId: challenge.challengeId,
      maskedPhone: challenge.maskedPhone,
    };
  }

  async verify(phone: string, challengeId: string, code: string) {
    const phoneE164 = this.normalizePhone(phone);
    const user = await this.findVerifiedPatientUser(phoneE164);
    if (!user) throw new BadRequestException(INVALID_CODE_MESSAGE);

    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpService.verify(
      {
        challengeId,
        userId: user.id,
        code,
        purpose: OtpPurpose.PHONE_PASSWORD_RESET,
      },
      async (manager) => {
        const repository = manager.getRepository(PasswordResetCode);
        await repository.update(
          { email: user.email, used: false },
          { used: true },
        );
        await repository.save(
          repository.create({
            userId: user.id,
            email: user.email,
            codeHash: tokenHash,
            used: false,
            expiresAt,
          }),
        );
      },
    );

    return {
      message: 'Código verificado correctamente',
      valid: true,
      resetToken,
    };
  }

  async reset(
    phone: string,
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const phoneE164 = this.normalizePhone(phone);
    await this.dataSource.transaction(async (manager) => {
      const patient = await manager
        .getRepository(Patient)
        .createQueryBuilder('patient')
        .setLock('pessimistic_write')
        .addSelect('patient.verifiedPhoneE164')
        .where('patient.verifiedPhoneE164 = :phoneE164', { phoneE164 })
        .getOne();
      if (!patient) throw new BadRequestException(INVALID_CODE_MESSAGE);

      const user = await manager.getRepository(User).findOne({
        where: { id: patient.userId, role: 'patient' },
      });
      if (!user) throw new BadRequestException(INVALID_CODE_MESSAGE);

      const resetRepository = manager.getRepository(PasswordResetCode);
      const candidates = await resetRepository
        .createQueryBuilder('reset')
        .setLock('pessimistic_write')
        .where('reset.userId = :userId', { userId: user.id })
        .andWhere('reset.email = :email', { email: user.email })
        .andWhere('reset.used = false')
        .andWhere('reset.expiresAt > :now', { now: new Date() })
        .orderBy('reset.createdAt', 'DESC')
        .take(5)
        .getMany();
      let grant: PasswordResetCode | null = null;
      for (const candidate of candidates) {
        if (await bcrypt.compare(resetToken, candidate.codeHash)) {
          grant = candidate;
          break;
        }
      }
      if (!grant) throw new BadRequestException(INVALID_CODE_MESSAGE);
      if (await bcrypt.compare(newPassword, user.password)) {
        throw new BadRequestException(
          'La nueva contraseña debe ser diferente a la actual',
        );
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      await manager.getRepository(User).save(user);
      await resetRepository.update(
        { email: user.email, used: false },
        { used: true },
      );
    });

    return {
      message:
        'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
      passwordUpdated: true,
    };
  }

  private normalizePhone(phone: string): string {
    try {
      return normalizeColombianPhone(phone);
    } catch {
      throw new BadRequestException('Ingresa un celular colombiano válido');
    }
  }

  private async findVerifiedPatientUser(phoneE164: string) {
    const patient = await this.patientRepository.findOne({
      where: { verifiedPhoneE164: phoneE164 },
      select: { userId: true, verifiedPhoneE164: true, phoneVerifiedAt: true },
    });
    if (!patient?.phoneVerifiedAt) return null;
    return this.userRepository.findOne({
      where: { id: patient.userId, role: 'patient' },
    });
  }
}
