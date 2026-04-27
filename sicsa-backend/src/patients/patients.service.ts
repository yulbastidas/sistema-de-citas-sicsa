import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

import { Patient } from './entities/patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  create(data: Partial<Patient>) {
    const patient = this.patientRepository.create(data);
    return this.patientRepository.save(patient);
  }

  findAll(search?: string) {
    if (!search) {
      return this.patientRepository.find({
        order: {
          id: 'DESC',
        },
      });
    }

    return this.patientRepository.find({
      where: [
        { numeroDocumento: Like(`%${search}%`) },
        { email: Like(`%${search}%`) },
        { primerNombre: Like(`%${search}%`) },
        { segundoNombre: Like(`%${search}%`) },
        { primerApellido: Like(`%${search}%`) },
        { segundoApellido: Like(`%${search}%`) },
        { telefono: Like(`%${search}%`) },
        { eps: Like(`%${search}%`) },
        { departamento: Like(`%${search}%`) },
        { municipio: Like(`%${search}%`) },
      ],
      order: {
        id: 'DESC',
      },
    });
  }

  async findByUserId(userId: number) {
    const patient = await this.patientRepository.findOne({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async findById(id: number) {
    const patient = await this.patientRepository.findOne({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async updateById(id: number, data: Partial<Patient>) {
    const patient = await this.findById(id);

    Object.assign(patient, data);

    return this.patientRepository.save(patient);
  }
}
