import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Verification } from './entities/verification.entity';

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
  ) {}

  // 🔹 Crear solicitud
  create(data: Partial<Verification>) {
    const verification = this.verificationRepository.create(data);
    return this.verificationRepository.save(verification);
  }

  // 🔹 Listar todas
  findAll() {
    return this.verificationRepository.find();
  }

  // 🔹 Aprobar
  async approve(id: number, adminId: number) {
    const verification = await this.verificationRepository.findOneBy({ id });

    if (!verification) {
      throw new Error('Verificación no encontrada');
    }

    verification.estado = 'aprobado';
    verification.adminId = adminId;

    return this.verificationRepository.save(verification);
  }

  // 🔹 Rechazar
  async reject(id: number, adminId: number, motivo: string) {
    const verification = await this.verificationRepository.findOneBy({ id });

    if (!verification) {
      throw new Error('Verificación no encontrada');
    }

    verification.estado = 'rechazado';
    verification.adminId = adminId;
    verification.motivoRechazo = motivo;

    return this.verificationRepository.save(verification);
  }
}
