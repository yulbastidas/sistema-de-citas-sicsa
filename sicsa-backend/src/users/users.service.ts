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

  private normalizeEmail(emailRaw: string): string {
    if (!emailRaw || typeof emailRaw !== 'string') {
      throw new BadRequestException('Correo inválido');
    }

    const email = emailRaw.trim().toLowerCase();

    if (!email || email.length > 150) {
      throw new BadRequestException('Correo inválido');
    }

    return email;
  }

  private normalizeText(value: string | undefined | null): string {
    if (!value || typeof value !== 'string') return '';
    return value.trim();
  }

  async create(data: CreateUserDto) {
    const email = this.normalizeEmail(data.email);

    const existingUser = await this.userRepo.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const user = this.userRepo.create({
      email,
      password: data.password,
      role: data.role,
    });

    const savedUser = await this.userRepo.save(user);

    if (savedUser.role === 'patient') {
      const patient = this.patientRepo.create({
        userId: savedUser.id,
        tipoDocumento: this.normalizeText(data.tipoDocumento),
        numeroDocumento: this.normalizeText(data.numeroDocumento),
        primerNombre: this.normalizeText(data.primerNombre),
        segundoNombre: this.normalizeText(data.segundoNombre),
        primerApellido: this.normalizeText(data.primerApellido),
        segundoApellido: this.normalizeText(data.segundoApellido),
        telefono: this.normalizeText(data.telefono),
        email,
        eps: this.normalizeText(data.eps),
      });

      await this.patientRepo.save(patient);
    }

    return {
      message: 'Usuario creado correctamente',
      user: savedUser,
    };
  }

  async findByEmail(emailRaw: string) {
    const email = this.normalizeEmail(emailRaw);

    return this.userRepo.findOne({
      where: { email },
    });
  }

  async findAll() {
    return this.userRepo.find();
  }
}
