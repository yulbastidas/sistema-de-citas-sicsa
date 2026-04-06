import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import axios from 'axios';

import { Appointment } from './entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { CreateAdminAppointmentDto } from './dto/create-admin-appointment.dto';
import { AppointmentsGateway } from './appointments.gateway';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

type PriorityResult = {
  prioridad: string;
  scorePrioridad: number;
  explicacionPrioridad: string;
};

type PatientSummary = {
  documento: string;
  nombre: string;
  telefono: string;
  email: string;
  eps: string;
};

export type AppointmentWithPatient = Appointment & {
  patient: PatientSummary | null;
};

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    private appointmentsGateway: AppointmentsGateway,
  ) {}

  async create(
    data: CreateAppointmentDto,
    user: JwtUser,
  ): Promise<AppointmentWithPatient> {
    await this.validateAvailableSlot(data.fecha, data.hora);

    const prioridadData = await this.getPrioridad(data);

    const appointmentData: Partial<Appointment> = {
      patientId: user.sub,
      fecha: data.fecha,
      hora: data.hora,
      motivoConsulta: data.motivoConsulta,
      edad: data.edad,
      embarazada: data.embarazada ?? false,
      discapacidad: data.discapacidad ?? false,
      dolorIntenso: data.dolorIntenso ?? false,
      sangrado: data.sangrado ?? false,
      dificultadRespiratoria: data.dificultadRespiratoria ?? false,
      fiebre: data.fiebre ?? false,
      estado: 'pendiente',
      prioridad: prioridadData.prioridad,
      scorePrioridad: prioridadData.scorePrioridad,
      explicacionPrioridad: prioridadData.explicacionPrioridad,
    };

    const appointment = this.appointmentRepo.create(appointmentData);
    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCreated(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message: 'Cola actualizada',
    });

    return result;
  }

  async createByAdmin(
    data: CreateAdminAppointmentDto,
  ): Promise<AppointmentWithPatient> {
    const patient = await this.patientRepo.findOne({
      where: { numeroDocumento: data.documento },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    await this.validateAvailableSlot(data.fecha, data.hora);

    const prioridadData = await this.getPrioridad(data);

    const appointmentData: Partial<Appointment> = {
      patientId: patient.userId,
      fecha: data.fecha,
      hora: data.hora,
      motivoConsulta: data.motivoConsulta,
      edad: data.edad,
      embarazada: data.embarazada ?? false,
      discapacidad: data.discapacidad ?? false,
      dolorIntenso: data.dolorIntenso ?? false,
      sangrado: data.sangrado ?? false,
      dificultadRespiratoria: data.dificultadRespiratoria ?? false,
      fiebre: data.fiebre ?? false,
      estado: 'pendiente',
      prioridad: prioridadData.prioridad,
      scorePrioridad: prioridadData.scorePrioridad,
      explicacionPrioridad: prioridadData.explicacionPrioridad,
    };

    const appointment = this.appointmentRepo.create(appointmentData);
    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCreated(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message: 'Cola actualizada',
    });

    return result;
  }

  async findAll(): Promise<AppointmentWithPatient[]> {
    const appointments = await this.appointmentRepo.find({
      order: {
        fecha: 'ASC',
        hora: 'ASC',
      },
    });

    return Promise.all(
      appointments.map((appointment) => this.attachPatientData(appointment)),
    );
  }

  async getByUser(userId: number): Promise<AppointmentWithPatient[]> {
    const appointments = await this.appointmentRepo.find({
      where: { patientId: userId },
      order: {
        fecha: 'DESC',
        hora: 'DESC',
      },
    });

    return Promise.all(
      appointments.map((appointment) => this.attachPatientData(appointment)),
    );
  }

  async approve(id: number): Promise<AppointmentWithPatient> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    appointment.estado = 'confirmada';

    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentUpdated(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message: 'Cola actualizada',
    });

    return result;
  }

  async cancel(id: number, user: JwtUser): Promise<AppointmentWithPatient> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (user.role !== 'admin' && appointment.patientId !== user.sub) {
      throw new BadRequestException('No puedes cancelar esta cita');
    }

    appointment.estado = 'cancelada';

    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCancelled(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message: 'Cola actualizada',
    });

    return result;
  }

  async getAvailable(fecha: string): Promise<string[]> {
    const allHours = [
      '07:00',
      '07:20',
      '07:40',
      '08:00',
      '08:20',
      '08:40',
      '09:00',
      '09:20',
      '09:40',
      '10:00',
      '10:20',
      '10:40',
      '11:00',
      '11:20',
      '11:40',
      '14:00',
      '14:20',
      '14:40',
      '15:00',
      '15:20',
      '15:40',
      '16:00',
      '16:20',
      '16:40',
      '17:00',
      '17:20',
      '17:40',
    ];

    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: Not('cancelada'),
      },
    });

    const occupiedHours = appointments.map((appointment) => appointment.hora);

    return allHours.filter((hour) => !occupiedHours.includes(hour));
  }

  async getQueue(fecha: string): Promise<AppointmentWithPatient[]> {
    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: Not('cancelada'),
      },
      order: {
        scorePrioridad: 'DESC',
        hora: 'ASC',
      },
    });

    return Promise.all(
      appointments.map((appointment) => this.attachPatientData(appointment)),
    );
  }

  async getTomorrowReminders(): Promise<AppointmentWithPatient[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const fecha = tomorrow.toISOString().split('T')[0];

    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: Not('cancelada'),
      },
    });

    return Promise.all(
      appointments.map((appointment) => this.attachPatientData(appointment)),
    );
  }

  private async validateAvailableSlot(
    fecha: string,
    hora: string,
  ): Promise<void> {
    const existingAppointment = await this.appointmentRepo.findOne({
      where: {
        fecha,
        hora,
        estado: Not('cancelada'),
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('Ese horario ya está ocupado');
    }
  }

  private async getPrioridad(
    data: CreateAppointmentDto | CreateAdminAppointmentDto,
  ): Promise<PriorityResult> {
    try {
      const response = await axios.post<{
        prioridad?: string;
        score?: number;
        explicacion?: string;
      }>('http://localhost:8000/prioridad', {
        motivoConsulta: data.motivoConsulta,
        edad: data.edad ?? 0,
        embarazada: data.embarazada ?? false,
        discapacidad: data.discapacidad ?? false,
        dolorIntenso: data.dolorIntenso ?? false,
        sangrado: data.sangrado ?? false,
        dificultadRespiratoria: data.dificultadRespiratoria ?? false,
        fiebre: data.fiebre ?? false,
      });

      return {
        prioridad: response.data.prioridad ?? 'baja',
        scorePrioridad: response.data.score ?? 0,
        explicacionPrioridad: response.data.explicacion ?? '',
      };
    } catch {
      return {
        prioridad: 'baja',
        scorePrioridad: 0,
        explicacionPrioridad: '',
      };
    }
  }

  private async attachPatientData(
    appointment: Appointment,
  ): Promise<AppointmentWithPatient> {
    const patient = await this.patientRepo.findOne({
      where: { userId: appointment.patientId },
    });

    return {
      ...appointment,
      patient: patient
        ? {
            documento: patient.numeroDocumento,
            nombre: `${patient.primerNombre} ${patient.primerApellido}`,
            telefono: patient.telefono,
            email: patient.email,
            eps: patient.eps,
          }
        : null,
    };
  }
}
