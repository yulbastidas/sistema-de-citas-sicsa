import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import axios from 'axios';

import { Appointment } from './entities/appointment.entity';
import { Verification } from '../verifications/entities/verification.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { AppointmentsGateway } from './appointments.gateway';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

interface IAResponse {
  prioridad: string;
  score: number;
  explicacion: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Verification)
    private verificationRepo: Repository<Verification>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    private appointmentsGateway: AppointmentsGateway,
  ) {}

  private async getPatientByUser(user: JwtUser): Promise<Patient> {
    const patient = await this.patientRepo.findOne({
      where: { userId: user.sub },
    });

    if (!patient) {
      throw new BadRequestException('Paciente no encontrado');
    }

    return patient;
  }

  private async notifyN8n(appointment: Appointment): Promise<void> {
    try {
      const patient = await this.patientRepo.findOne({
        where: { id: appointment.patientId },
      });

      if (!patient) {
        throw new BadRequestException(
          'Paciente no encontrado para enviar a n8n',
        );
      }

      if (!patient.email || patient.email.trim() === '') {
        throw new BadRequestException('El paciente no tiene email válido');
      }

      const nombre = `${patient.primerNombre} ${patient.primerApellido}`;
      const email = patient.email.trim();

      await axios.post('http://localhost:5678/webhook/cita-creada', {
        nombre,
        email,
        fecha: appointment.fecha,
        hora: appointment.hora,
        estado: appointment.estado,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error enviando cita a n8n:', error.message);
      } else {
        console.error('Error enviando cita a n8n:', 'Error desconocido');
      }
    }
  }

  async create(data: CreateAppointmentDto, user: JwtUser) {
    const patient = await this.getPatientByUser(user);
    const patientId = patient.id;

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

    const iaResponse = await axios.post<IAResponse>(
      'http://localhost:8000/prioridad',
      {
        motivoConsulta: data.motivoConsulta,
        edad: data.edad,
        embarazada: data.embarazada ?? false,
        discapacidad: data.discapacidad ?? false,
        dolorIntenso: data.dolorIntenso ?? false,
        sangrado: data.sangrado ?? false,
        dificultadRespiratoria: data.dificultadRespiratoria ?? false,
        fiebre: data.fiebre ?? false,
      },
    );

    const appointment = this.appointmentRepo.create({
      patientId,
      fecha: data.fecha,
      hora: data.hora,
      estado: 'pendiente',
      motivoConsulta: data.motivoConsulta,
      edad: data.edad,
      embarazada: data.embarazada ?? false,
      discapacidad: data.discapacidad ?? false,
      dolorIntenso: data.dolorIntenso ?? false,
      sangrado: data.sangrado ?? false,
      dificultadRespiratoria: data.dificultadRespiratoria ?? false,
      fiebre: data.fiebre ?? false,
      prioridad: iaResponse.data.prioridad,
      scorePrioridad: iaResponse.data.score,
      explicacionPrioridad: iaResponse.data.explicacion,
    });

    const savedAppointment = await this.appointmentRepo.save(appointment);

    this.appointmentsGateway.emitAppointmentCreated({
      message: 'Nueva cita creada',
      appointment: savedAppointment,
    });

    return savedAppointment;
  }

  findAll() {
    return this.appointmentRepo.find();
  }

  async getByUser(userId: number) {
    const patient = await this.patientRepo.findOne({
      where: { userId },
    });

    if (!patient) {
      throw new BadRequestException('Paciente no encontrado');
    }

    return this.appointmentRepo.find({
      where: { patientId: patient.id },
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

    const updatedAppointment = await this.appointmentRepo.save(appointment);

    await this.notifyN8n(updatedAppointment);

    this.appointmentsGateway.emitAppointmentUpdated({
      message: 'Cita aprobada',
      appointment: updatedAppointment,
    });

    return updatedAppointment;
  }

  async cancel(id: number, user: JwtUser) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new BadRequestException('Cita no encontrada');
    }

    if (user.role !== 'admin') {
      const patient = await this.getPatientByUser(user);

      if (appointment.patientId !== patient.id) {
        throw new BadRequestException('No autorizado');
      }
    }

    appointment.estado = 'cancelada';

    const updatedAppointment = await this.appointmentRepo.save(appointment);

    this.appointmentsGateway.emitAppointmentUpdated({
      message: 'Cita cancelada',
      appointment: updatedAppointment,
    });

    return updatedAppointment;
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

    const horasOcupadas = ocupadas.map((cita) => cita.hora);

    return horariosBase.filter((hora) => !horasOcupadas.includes(hora));
  }

  async getQueue(fecha: string) {
    return this.appointmentRepo.find({
      where: {
        fecha,
        estado: 'confirmada',
      },
      order: {
        prioridad: 'DESC',
        hora: 'ASC',
      },
    });
  }
}
