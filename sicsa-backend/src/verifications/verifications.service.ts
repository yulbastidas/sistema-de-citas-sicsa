import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import axios from 'axios';

import { Patient } from '../patients/entities/patient.entity';
import { Verification } from './entities/verification.entity';
import { VerificationsGateway } from './verifications.gateway';
import { PageRequest, pageResult } from '../common/pagination';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(Verification)
    private verificationRepo: Repository<Verification>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    private verificationsGateway: VerificationsGateway,
  ) {}

  private isExpired(verification: Verification): boolean {
    if (!verification.fechaExpiracion) return false;
    return new Date() > new Date(verification.fechaExpiracion);
  }

  private async expireIfNeeded(
    verification: Verification | null,
  ): Promise<Verification | null> {
    if (!verification) return null;

    if (verification.estado === 'aprobado' && this.isExpired(verification)) {
      verification.estado = 'expirado';
      verification.fechaExpiracion = null;

      const saved = await this.verificationRepo.save(verification);
      this.verificationsGateway.emitVerificationUpdated(saved);
      return saved;
    }

    return verification;
  }

  async requestVerification(
    data: { documento: string; eps: string },
    user: JwtUser,
  ) {
    const latestVerification = await this.verificationRepo.findOne({
      where: { patientId: user.sub },
      order: { id: 'DESC' },
    });

    const normalizedEstado = (latestVerification?.estado || '').toLowerCase();

    if (latestVerification && normalizedEstado === 'pendiente') {
      throw new BadRequestException('Ya existe una solicitud pendiente');
    }

    if (latestVerification && normalizedEstado === 'aprobado') {
      const updatedVerification = await this.expireIfNeeded(latestVerification);

      if (updatedVerification?.estado === 'aprobado') {
        throw new BadRequestException(
          'Ya tienes una verificación aprobada activa',
        );
      }
    }

    const verification = this.verificationRepo.create({
      patientId: user.sub,
      documento: data.documento,
      eps: data.eps,
      estado: 'pendiente',
      motivoRechazo: null,
      adminId: null,
      fechaExpiracion: null,
    });

    const saved = await this.verificationRepo.save(verification);
    this.verificationsGateway.emitVerificationRequested(saved);

    return saved;
  }

  async findAll(
    pagination: PageRequest,
    filters: { status?: string; search?: string },
  ) {
    const query = this.verificationRepo.createQueryBuilder('verification')
      .leftJoin(Patient, 'verificationPatient', 'verificationPatient.userId = verification.patientId');
    if (filters.status && filters.status !== 'todos') {
      query.andWhere('LOWER(verification.estado) = LOWER(:status)', { status: filters.status });
    }
    if (filters.search?.trim()) {
      query.andWhere(`(verification.documento LIKE :search OR verificationPatient.email LIKE :search
        OR verificationPatient.primerNombre LIKE :search OR verificationPatient.primerApellido LIKE :search)`,
      { search: `%${filters.search.trim()}%` });
    }
    const [verifications, total] = await query.orderBy('verification.id', 'DESC')
      .skip((pagination.page - 1) * pagination.limit).take(pagination.limit)
      .getManyAndCount();

    const patientIds = [...new Set(verifications.map((item) => item.patientId))];
    const patients = patientIds.length
      ? await this.patientRepo.find({ where: { userId: In(patientIds) } })
      : [];
    const patientByUser = new Map(patients.map((item) => [item.userId, item]));

    const result = await Promise.all(
      verifications.map(async (verification) => {
        const checkedVerification = await this.expireIfNeeded(verification);
        const patient = checkedVerification
          ? patientByUser.get(checkedVerification.patientId)
          : undefined;

        return {
          ...checkedVerification,
          patient: patient
            ? {
                nombre: `${patient.primerNombre} ${patient.primerApellido}`,
                email: patient.email,
                telefono: patient.telefono,
                epsPaciente: patient.eps,
              }
            : null,
        };
      }),
    );

    return pageResult(result, total, pagination);
  }

  async approve(id: number, admin: JwtUser) {
    const verification = await this.verificationRepo.findOne({
      where: { id },
    });

    if (!verification) {
      throw new BadRequestException('Solicitud no encontrada');
    }

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    verification.estado = 'aprobado';
    verification.motivoRechazo = null;
    verification.adminId = admin.sub;
    verification.fechaExpiracion = expirationDate;

    const savedVerification = await this.verificationRepo.save(verification);
    this.verificationsGateway.emitVerificationUpdated(savedVerification);

    const patient = await this.patientRepo.findOne({
      where: { userId: verification.patientId },
    });

    if (patient) {
      const webhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;

      if (!webhookUrl) {
        console.warn('N8N_EMAIL_WEBHOOK_URL no está configurada');
      } else {
        try {
          await axios.post(webhookUrl, {
            nombre: patient.primerNombre,
            email: patient.email,
            documento: patient.numeroDocumento,
            eps: patient.eps,
            idempotencyKey: `verification-approved:${savedVerification.id}`,
          }, { timeout: Number(process.env.N8N_TIMEOUT_MS || 5000) });

          console.log('Webhook verificacion-aprobada enviado a n8n');
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            console.error(
              'Error enviando webhook a n8n:',
              error.message,
            );
          } else if (error instanceof Error) {
            console.error('Error enviando webhook a n8n:', error.message);
          } else {
            console.error('Error enviando webhook a n8n:', error);
          }
        }
      }
    } else {
      console.warn(
        `No se encontró paciente con userId ${verification.patientId}`,
      );
    }

    return savedVerification;
  }

  async reject(id: number, motivoRechazo: string, admin: JwtUser) {
    const verification = await this.verificationRepo.findOne({
      where: { id },
    });

    if (!verification) {
      throw new BadRequestException('Solicitud no encontrada');
    }

    verification.estado = 'rechazado';
    verification.motivoRechazo = motivoRechazo;
    verification.adminId = admin.sub;
    verification.fechaExpiracion = null;

    const savedVerification = await this.verificationRepo.save(verification);
    this.verificationsGateway.emitVerificationUpdated(savedVerification);

    return savedVerification;
  }

  async getByPatient(userId: number) {
    const verification = await this.verificationRepo.findOne({
      where: { patientId: userId },
      order: { id: 'DESC' },
    });

    const checkedVerification = await this.expireIfNeeded(verification);

    return checkedVerification || null;
  }

  async expireMyVerification(userId: number) {
    const verification = await this.verificationRepo.findOne({
      where: { patientId: userId },
      order: { id: 'DESC' },
    });

    if (!verification) {
      return { message: 'No hay verificación para expirar' };
    }

    verification.estado = 'expirado';
    verification.fechaExpiracion = null;

    const savedVerification = await this.verificationRepo.save(verification);
    this.verificationsGateway.emitVerificationUpdated(savedVerification);

    return { message: 'Verificación expirada correctamente' };
  }
}
