import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
import { OtpPurpose } from '../auth/otp/otp-purpose';
import { OtpService } from '../auth/otp/otp.service';
import { maskPhone, normalizeColombianPhone } from './security/colombian-phone';
import { Patient } from './entities/patient.entity';

@Injectable()
export class PhoneVerificationService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly otpService: OtpService,
  ) {}

  private async getPatient(userId: number): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Paciente no encontrado');
    return patient;
  }

  private async assertPhoneAvailable(
    phoneE164: string,
    patientId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(Patient)
      : this.patientRepository;
    const duplicate = await repository.findOne({
      where: { verifiedPhoneE164: phoneE164, id: Not(patientId) },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('No fue posible verificar este celular');
    }
  }

  async status(userId: number) {
    const patient = await this.patientRepository
      .createQueryBuilder('patient')
      .addSelect(['patient.verifiedPhoneE164', 'patient.phoneVerifiedAt'])
      .where('patient.userId = :userId', { userId })
      .getOne();
    if (!patient) throw new NotFoundException('Paciente no encontrado');
    return {
      verified: Boolean(patient.verifiedPhoneE164 && patient.phoneVerifiedAt),
      maskedPhone: patient.verifiedPhoneE164
        ? maskPhone(patient.verifiedPhoneE164)
        : null,
      phoneVerifiedAt: patient.phoneVerifiedAt ?? null,
    };
  }

  async requestCode(userId: number, phone: string, requestIp: string) {
    const patient = await this.getPatient(userId);
    let phoneE164: string;
    try {
      phoneE164 = normalizeColombianPhone(phone);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Celular inválido',
      );
    }
    await this.assertPhoneAvailable(phoneE164, patient.id);
    return this.otpService.request({
      userId,
      phone: phoneE164,
      requestIp,
      purpose: OtpPurpose.PHONE_VERIFICATION,
    });
  }

  async verifyCode(userId: number, challengeId: string, code: string) {
    const verifiedAt = new Date();
    let maskedPhone = '';
    await this.otpService.verify(
      { challengeId, userId, code, purpose: OtpPurpose.PHONE_VERIFICATION },
      async (manager, phoneE164) => {
        const repository = manager.getRepository(Patient);
        const patient = await repository
          .createQueryBuilder('patient')
          .setLock('pessimistic_write')
          .addSelect(['patient.verifiedPhoneE164'])
          .where('patient.userId = :userId', { userId })
          .getOne();
        if (!patient) throw new NotFoundException('Paciente no encontrado');
        await this.assertPhoneAvailable(phoneE164, patient.id, manager);
        const changed =
          Boolean(patient.verifiedPhoneE164) &&
          patient.verifiedPhoneE164 !== phoneE164;
        patient.verifiedPhoneE164 = phoneE164;
        patient.phoneVerifiedAt = verifiedAt;
        if (changed) patient.phoneChangedAt = verifiedAt;
        await repository.save(patient);
        maskedPhone = maskPhone(phoneE164);
      },
    );
    if (!maskedPhone)
      throw new BadRequestException('Código inválido o vencido');
    return {
      message: 'Celular verificado correctamente',
      maskedPhone,
      phoneVerifiedAt: verifiedAt,
    };
  }
}
