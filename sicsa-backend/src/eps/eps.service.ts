import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Eps } from './entities/eps.entity';

@Injectable()
export class EpsService {
  constructor(
    @InjectRepository(Eps)
    private readonly epsRepo: Repository<Eps>,
  ) {}

  async findAll(): Promise<Eps[]> {
    return this.epsRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }
}
