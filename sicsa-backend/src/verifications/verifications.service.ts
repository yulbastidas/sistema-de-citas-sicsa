import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

    return this.verificationRepo.save(verification);
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
