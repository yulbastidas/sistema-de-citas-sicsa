import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  findAll() {
    return this.patientRepository.find();
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
}
