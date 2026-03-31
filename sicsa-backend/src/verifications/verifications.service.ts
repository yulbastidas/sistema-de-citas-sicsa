import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';

import { Patient } from '../patients/entities/patient.entity';
import { Verification } from './entities/verification.entity';

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
  ) {}

  async requestVerification(
    data: { documento: string; eps: string },
    user: JwtUser,
  ) {
    const existingPendingOrApproved = await this.verificationRepo.findOne({
      where: [
        { patientId: user.sub, estado: 'pendiente' },
        { patientId: user.sub, estado: 'aprobado' },
      ],
    });

    if (existingPendingOrApproved) {
      throw new BadRequestException(
        'Ya existe una solicitud pendiente o aprobada',
      );
    }

    const verification = this.verificationRepo.create({
      patientId: user.sub,
      documento: data.documento,
      eps: data.eps,
      estado: 'pendiente',
      motivoRechazo: null,
      adminId: null,
    });

    return this.verificationRepo.save(verification);
  }

  findAll() {
    return this.verificationRepo.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async approve(id: number, admin: JwtUser) {
    const verification = await this.verificationRepo.findOne({
      where: { id },
    });

    if (!verification) {
      throw new BadRequestException('Solicitud no encontrada');
    }

    verification.estado = 'aprobado';
    verification.motivoRechazo = null;
    verification.adminId = admin.sub;

    const savedVerification = await this.verificationRepo.save(verification);

    const patient = await this.patientRepo.findOne({
      where: { userId: verification.patientId },
    });

    if (patient) {
      try {
        await axios.post(
          'http://localhost:5678/webhook/verificacion-aprobada',
          {
            nombre: patient.primerNombre,
            email: patient.email,
          },
        );
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

    return this.verificationRepo.save(verification);
  }
}
