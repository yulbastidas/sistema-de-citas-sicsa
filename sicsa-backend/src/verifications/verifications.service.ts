import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';

import { Patient } from '../patients/entities/patient.entity';
import { Verification } from './entities/verification.entity';
import { VerificationsGateway } from './verifications.gateway';

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

  async findAll() {
    const verifications = await this.verificationRepo.find({
      order: {
        id: 'DESC',
      },
    });

    const result = await Promise.all(
      verifications.map(async (verification) => {
        const checkedVerification = await this.expireIfNeeded(verification);

        const patient = await this.patientRepo.findOne({
          where: { userId: checkedVerification?.patientId },
        });

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

    return result;
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
      try {
        await axios.post('http://localhost:5678/webhook/verificacion-aprobada', {
          nombre: patient.primerNombre,
          email: patient.email,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Error enviando webhook a n8n:', error.message);
        } else {
          console.error('Error enviando webhook a n8n:', error);
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
      order: {
        id: 'DESC',
      },
    });

    const checkedVerification = await this.expireIfNeeded(verification);

    return checkedVerification || null;
  }

  async expireMyVerification(userId: number) {
    const verification = await this.verificationRepo.findOne({
      where: { patientId: userId },
      order: {
        id: 'DESC',
      },
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
