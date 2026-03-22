import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { Appointment } from './entities/appointment.entity';
import { Verification } from '../verifications/entities/verification.entity';
import { CreateAppointmentDto } from './dto/appointment.dto';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Verification)
    private verificationRepo: Repository<Verification>,
  ) {}

  async create(data: CreateAppointmentDto, user: JwtUser) {
    const patientId = user.sub;

    if (user.role !== 'admin') {
      const verification = await this.verificationRepo.findOne({
        where: {
          patientId,
          estado: 'aprobado',
        },
      });

      if (!verification) {
        throw new BadRequestException('No está verificado');
      }
    }

    const existingAppointment = await this.appointmentRepo.findOne({
      where: {
        fecha: data.fecha,
        hora: data.hora,
        estado: Not('cancelada'),
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('Esta hora ya está ocupada');
    }

    const appointment = this.appointmentRepo.create({
      patientId,
      fecha: data.fecha,
      hora: data.hora,
      estado: 'pendiente',
    });

    return this.appointmentRepo.save(appointment);
  }

  findAll() {
    return this.appointmentRepo.find();
  }

  async getByUser(userId: number) {
    return this.appointmentRepo.find({
      where: { patientId: userId },
    });
  }

  async approve(id: number) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new BadRequestException('Cita no encontrada');
    }

    appointment.estado = 'confirmada';

    return this.appointmentRepo.save(appointment);
  }

  async cancel(id: number, user: JwtUser) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new BadRequestException('Cita no encontrada');
    }

    if (user.role !== 'admin' && appointment.patientId !== user.sub) {
      throw new BadRequestException('No autorizado');
    }

    appointment.estado = 'cancelada';

    return this.appointmentRepo.save(appointment);
  }

  async getAvailable(fecha: string) {
    const horariosBase = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '14:00',
      '15:00',
      '16:00',
    ];

    const ocupadas = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: Not('cancelada'),
      },
    });

    const horasOcupadas = ocupadas.map((c) => c.hora);

    return horariosBase.filter((hora) => !horasOcupadas.includes(hora));
  }

  async getQueue(fecha: string) {
    return this.appointmentRepo.find({
      where: {
        fecha,
        estado: 'confirmada',
      },
      order: {
        hora: 'ASC',
      },
    });
  }
}
