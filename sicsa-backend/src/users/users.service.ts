import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  async create(data: CreateUserDto) {
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const user = this.userRepo.create({
      email: data.email,
      password: data.password,
      role: data.role,
    });

    const savedUser = await this.userRepo.save(user);

    if (savedUser.role === 'patient') {
      const patient = this.patientRepo.create({
        userId: savedUser.id,
        tipoDocumento: data.tipoDocumento ?? '',
        numeroDocumento: data.numeroDocumento ?? '',
        primerNombre: data.primerNombre ?? '',
        segundoNombre: data.segundoNombre ?? '',
        primerApellido: data.primerApellido ?? '',
        segundoApellido: data.segundoApellido ?? '',
        telefono: data.telefono ?? '',
        email: data.email,
        eps: data.eps ?? '',
      });

      await this.patientRepo.save(patient);
    }

    return {
      message: 'Usuario creado correctamente',
      user: savedUser,
    };
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email },
    });
  }

  async findAll() {
    return this.userRepo.find();
  }
}
