import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import { Eps } from '../eps/entities/eps.entity';
import { Patient } from '../patients/entities/patient.entity';
import { normalizeColombianPhone } from '../patients/security/colombian-phone';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { PendingPhoneRegistration } from './entities/pending-phone-registration.entity';
import { OtpPurpose } from './otp/otp-purpose';
import { OtpService } from './otp/otp.service';

type StoredRegistration = Omit<RegisterDto, 'password'>;

@Injectable()
export class PhoneRegistrationService {
  constructor(
    @InjectRepository(PendingPhoneRegistration)
    private readonly pendingRepository: Repository<PendingPhoneRegistration>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Eps)
    private readonly epsRepository: Repository<Eps>,
    private readonly otpService: OtpService,
  ) {}

  async start(data: RegisterDto, requestIp: string) {
    await this.pendingRepository.delete({
      expiresAt: LessThanOrEqual(new Date()),
    });
    const email = data.email.trim().toLowerCase();
    const phoneE164 = this.normalizePhone(data.telefono);
    const documentNumber = data.numeroDocumento.trim();
    await this.assertRegistrationAvailable(email, phoneE164, documentNumber);
    const eps = await this.assertEps(data.epsId, data.eps);

    const collisions = await this.pendingRepository.find({
      where: [{ email }, { phoneE164 }, { documentNumber }],
    });
    const exact = collisions.find(
      (item) =>
        item.email === email &&
        item.phoneE164 === phoneE164 &&
        item.documentNumber === documentNumber,
    );
    if (collisions.length > 0 && !exact) {
      throw new BadRequestException('No fue posible iniciar el registro');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const stored: StoredRegistration = {
      ...data,
      email,
      telefono: phoneE164.slice(3),
      eps: eps.nombre,
    };
    const pending = exact ?? this.pendingRepository.create();
    pending.email = email;
    pending.phoneE164 = phoneE164;
    pending.documentNumber = documentNumber;
    pending.passwordHash = passwordHash;
    pending.registrationData = JSON.stringify(stored);
    pending.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const saved = await this.pendingRepository.save(pending);

    try {
      const challenge = await this.otpService.request({
        userId: saved.id,
        phone: phoneE164,
        requestIp,
        purpose: OtpPurpose.PHONE_REGISTRATION,
      });
      saved.expiresAt = challenge.expiresAt;
      await this.pendingRepository.update(saved.id, {
        expiresAt: challenge.expiresAt,
      });
      return { registrationId: saved.id, ...challenge };
    } catch (error) {
      if (!exact) await this.pendingRepository.delete(saved.id);
      throw error;
    }
  }

  async resend(registrationId: number, requestIp: string) {
    const pending = await this.getPending(registrationId);
    const challenge = await this.otpService.request({
      userId: pending.id,
      phone: pending.phoneE164,
      requestIp,
      purpose: OtpPurpose.PHONE_REGISTRATION,
    });
    await this.pendingRepository.update(pending.id, {
      expiresAt: challenge.expiresAt,
    });
    return { registrationId: pending.id, ...challenge };
  }

  async verify(registrationId: number, challengeId: string, code: string) {
    await this.getPending(registrationId);
    await this.otpService.verify(
      {
        challengeId,
        userId: registrationId,
        code,
        purpose: OtpPurpose.PHONE_REGISTRATION,
      },
      async (manager, verifiedPhone) => {
        const pendingRepository = manager.getRepository(
          PendingPhoneRegistration,
        );
        const pending = await pendingRepository
          .createQueryBuilder('pending')
          .setLock('pessimistic_write')
          .addSelect(['pending.passwordHash', 'pending.registrationData'])
          .where('pending.id = :registrationId', { registrationId })
          .getOne();
        if (!pending || pending.expiresAt <= new Date()) {
          throw new BadRequestException('Código inválido o vencido');
        }
        if (pending.phoneE164 !== verifiedPhone) {
          throw new BadRequestException('Código inválido o vencido');
        }
        const data = JSON.parse(pending.registrationData) as StoredRegistration;
        await this.assertAvailableWithManager(
          manager,
          pending.email,
          verifiedPhone,
          pending.documentNumber,
        );
        const eps = await manager.getRepository(Eps).findOne({
          where: { id: data.epsId, activo: true },
        });
        if (!eps)
          throw new BadRequestException(
            'La EPS seleccionada ya no está disponible',
          );

        const user = await manager.getRepository(User).save(
          manager.getRepository(User).create({
            email: pending.email,
            password: pending.passwordHash,
            role: 'patient',
            emailVerified: false,
          }),
        );
        const now = new Date();
        await manager.getRepository(Patient).save(
          manager.getRepository(Patient).create({
            userId: user.id,
            tipoDocumento: data.tipoDocumento,
            numeroDocumento: data.numeroDocumento,
            primerNombre: data.primerNombre,
            segundoNombre: data.segundoNombre,
            primerApellido: data.primerApellido,
            segundoApellido: data.segundoApellido,
            telefono: data.telefono,
            email: pending.email,
            eps: eps.nombre,
            epsId: eps.id,
            genero: data.genero,
            fechaNacimiento: data.fechaNacimiento,
            departamento: data.departamento,
            municipio: data.municipio,
            verifiedPhoneE164: verifiedPhone,
            phoneVerifiedAt: now,
            phoneChangedAt: now,
          }),
        );
        await pendingRepository.delete(pending.id);
      },
    );
    return {
      message: 'Celular verificado y registro completado.',
      phoneVerified: true,
    };
  }

  private async getPending(id: number): Promise<PendingPhoneRegistration> {
    const pending = await this.pendingRepository.findOne({ where: { id } });
    if (!pending || pending.expiresAt <= new Date()) {
      throw new NotFoundException('Registro pendiente no encontrado o vencido');
    }
    return pending;
  }

  private normalizePhone(phone: string): string {
    try {
      return normalizeColombianPhone(phone);
    } catch {
      throw new BadRequestException('Ingresa un celular colombiano válido');
    }
  }

  private async assertEps(id: number, name: string): Promise<Eps> {
    const eps = await this.epsRepository.findOne({
      where: { id, activo: true },
    });
    if (
      !eps ||
      eps.nombre.trim().toLocaleLowerCase('es-CO') !==
        name.trim().toLocaleLowerCase('es-CO')
    ) {
      throw new BadRequestException('La EPS seleccionada no es válida');
    }
    return eps;
  }

  private async assertRegistrationAvailable(
    email: string,
    phone: string,
    document: string,
  ) {
    const [user, patient, phoneOwner] = await Promise.all([
      this.userRepository.findOne({ where: { email } }),
      this.patientRepository.findOne({ where: { numeroDocumento: document } }),
      this.patientRepository
        .createQueryBuilder('patient')
        .addSelect('patient.verifiedPhoneE164')
        .where('patient.verifiedPhoneE164 = :phone', { phone })
        .getOne(),
    ]);
    if (user || patient || phoneOwner) {
      throw new BadRequestException('No fue posible iniciar el registro');
    }
  }

  private async assertAvailableWithManager(
    manager: EntityManager,
    email: string,
    phone: string,
    document: string,
  ) {
    const [user, patient, phoneOwner] = await Promise.all([
      manager.getRepository(User).findOne({ where: { email } }),
      manager
        .getRepository(Patient)
        .findOne({ where: { numeroDocumento: document } }),
      manager
        .getRepository(Patient)
        .createQueryBuilder('patient')
        .addSelect('patient.verifiedPhoneE164')
        .where('patient.verifiedPhoneE164 = :phone', { phone })
        .getOne(),
    ]);
    if (user || patient || phoneOwner)
      throw new BadRequestException('No fue posible completar el registro');
  }
}
