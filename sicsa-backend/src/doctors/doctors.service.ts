import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  async findActiveBySpecialty(specialtyIdRaw?: string): Promise<Doctor[]> {
    const specialtyId = Number(specialtyIdRaw);
    if (!Number.isInteger(specialtyId) || specialtyId <= 0) {
      throw new BadRequestException('specialtyId debe ser un número válido');
    }

    return this.doctorRepo.find({
      where: { especialidadId: specialtyId, activo: true },
      select: {
        id: true,
        nombre: true,
        especialidadId: true,
        consultorio: true,
      },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  }

  async findByUserId(userId: number): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({
      where: {
        userId,
        activo: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    return doctor;
  }
}
