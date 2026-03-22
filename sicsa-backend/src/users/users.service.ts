import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // 🔹 Registrar usuario
  async create(data: CreateUserDto) {
    // Validar si ya existe
    const existing = await this.userRepo.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('El correo ya existe');
    }

    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  // 🔹 Buscar por email (para login)
  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }
}
