import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import axios from 'axios';

import { Appointment } from './entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { CreateAdminAppointmentDto } from './dto/create-admin-appointment.dto';
import { AppointmentsGateway } from './appointments.gateway';
import {
  AppointmentPdfService,
  MedicalReportPdfData,
} from './pdf/appointment-pdf.service';
import { MedicalReportsService } from '../medical-reports/medical-reports.service';
import { MedicalReport } from '../medical-reports/entities/medical-report.entity';

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

type MedicalReportSummary = {
  exists: boolean;
  id: number | null;
};

type ReminderAppointment = {
  email: string;
  nombre: string;
  fecha: string;
  hora: string;
};

export type AppointmentWithPatient = Appointment & {
  patient: PatientSummary | null;
  medicalReport: MedicalReportSummary;
};

type AppointmentInput = CreateAppointmentDto | CreateAdminAppointmentDto;

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    private appointmentsGateway: AppointmentsGateway,
    private appointmentPdfService: AppointmentPdfService,
    private medicalReportsService: MedicalReportsService,
  ) {}

  async create(
    data: CreateAppointmentDto,
    user: JwtUser,
  ): Promise<AppointmentWithPatient> {
    const duration = this.getAppointmentDuration(data.appointmentClassId);

    this.validateBusinessSchedule(data.fecha, data.hora, duration);
    this.validateRadiologyBase(data);

    const slotAvailable = await this.isSlotAvailable(
      data.fecha,
      data.hora,
      duration,
    );

    const appointmentStatus = slotAvailable ? 'confirmada' : 'lista_espera';

    const assignedDoctor = await this.findDoctorBySpecialty(data.specialtyId);
    const prioridadData = await this.getPrioridad(data);

    const appointmentData: Partial<Appointment> = {
      patientId: user.sub,
      doctorId: assignedDoctor.id,
      specialtyId: data.specialtyId,
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
      estado: appointmentStatus,
      prioridad: prioridadData.prioridad,
      scorePrioridad: prioridadData.scorePrioridad,
      explicacionPrioridad: prioridadData.explicacionPrioridad,
      eps: data.eps,
      epsId: data.epsId,
      departamento: data.departamento,
      municipio: data.municipio,
      appointmentClassId: data.appointmentClassId,
      observaciones: data.observaciones,
      ordenMedicaUrl: data.ordenMedicaUrl,
      approvedAt: appointmentStatus === 'confirmada' ? new Date() : undefined,
    };

    const appointment = this.appointmentRepo.create(appointmentData);
    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCreated(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message:
        saved.estado === 'lista_espera'
          ? 'Cita agregada a lista de espera'
          : 'Cola actualizada',
    });

    if (saved.estado === 'confirmada') {
      await this.sendAppointmentCreatedToN8n(result);
    }

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

    const duration = this.getAppointmentDuration(data.appointmentClassId);

    this.validateBusinessSchedule(data.fecha, data.hora, duration);
    this.validateRadiologyBase(data);

    const slotAvailable = await this.isSlotAvailable(
      data.fecha,
      data.hora,
      duration,
    );

    const appointmentStatus = slotAvailable ? 'confirmada' : 'lista_espera';

    const assignedDoctor = await this.findDoctorBySpecialty(data.specialtyId);
    const prioridadData = await this.getPrioridad(data);

    const appointmentData: Partial<Appointment> = {
      patientId: patient.userId,
      doctorId: assignedDoctor.id,
      specialtyId: data.specialtyId,
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
      estado: appointmentStatus,
      prioridad: prioridadData.prioridad,
      scorePrioridad: prioridadData.scorePrioridad,
      explicacionPrioridad: prioridadData.explicacionPrioridad,
      eps: data.eps ?? patient.eps,
      epsId: data.epsId ?? patient.epsId,
      departamento: data.departamento ?? patient.departamento,
      municipio: data.municipio ?? patient.municipio,
      appointmentClassId: data.appointmentClassId,
      observaciones: data.observaciones,
      ordenMedicaUrl: data.ordenMedicaUrl,
      approvedAt: appointmentStatus === 'confirmada' ? new Date() : undefined,
    };

    const appointment = this.appointmentRepo.create(appointmentData);
    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCreated(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message:
        saved.estado === 'lista_espera'
          ? 'Cita agregada a lista de espera'
          : 'Cola actualizada',
    });

    if (saved.estado === 'confirmada') {
      await this.sendAppointmentCreatedToN8n(result);
    }

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

  async findByDoctor(doctorId: number): Promise<AppointmentWithPatient[]> {
    const realDoctorId = await this.resolveDoctorId(doctorId);

    const appointments = await this.appointmentRepo.find({
      where: { doctorId: realDoctorId },
      order: {
        fecha: 'ASC',
        hora: 'ASC',
      },
    });

    return Promise.all(
      appointments.map((appointment) => this.attachPatientData(appointment)),
    );
  }

  async findHistoryByDoctor(
    doctorId: number,
  ): Promise<AppointmentWithPatient[]> {
    const realDoctorId = await this.resolveDoctorId(doctorId);

    const appointments = await this.appointmentRepo.find({
      where: { doctorId: realDoctorId },
      order: {
        fecha: 'DESC',
        hora: 'DESC',
      },
    });

    const enrichedAppointments = await Promise.all(
      appointments.map((appointment) => this.attachPatientData(appointment)),
    );

    return enrichedAppointments.filter(
      (appointment) =>
        appointment.estado?.toLowerCase() === 'atendida' ||
        appointment.medicalReport?.exists,
    );
  }

  async approve(id: number, user: JwtUser): Promise<AppointmentWithPatient> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    appointment.estado = 'confirmada';
    appointment.approvedByAdminId = user.sub;
    appointment.approvedAt = new Date();

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

    const releasedFecha = appointment.fecha;
    const releasedHora = appointment.hora;
    const releasedDuration = this.getAppointmentDuration(
      appointment.appointmentClassId,
    );

    appointment.estado = 'cancelada';

    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCancelled(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message: 'Cola actualizada',
    });

    await this.assignReleasedSlotToWaitlist(
      releasedFecha,
      releasedHora,
      releasedDuration,
    );

    return result;
  }

  async getAvailable(
    fecha: string,
    appointmentClassId?: number,
  ): Promise<string[]> {
    const duration = this.getAppointmentDuration(appointmentClassId);
    const hours = this.generateAvailableHoursByDate(fecha);

    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: In(this.getBlockingStates()),
      },
    });

    return hours.filter((hour) => {
      try {
        this.validateBusinessSchedule(fecha, hour, duration);
        return !this.hasScheduleConflict(hour, duration, appointments);
      } catch {
        return false;
      }
    });
  }

  async getQueue(
    fecha: string,
    doctorId?: number,
  ): Promise<AppointmentWithPatient[]> {
    if (doctorId) {
      const realDoctorId = await this.resolveDoctorId(doctorId);

      const appointments = await this.appointmentRepo.find({
        where: {
          fecha,
          doctorId: realDoctorId,
          estado: 'confirmada',
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

    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: 'confirmada',
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
    const fecha = this.getTomorrowDate();

    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: 'confirmada',
      },
      order: {
        hora: 'ASC',
      },
    });

    return Promise.all(
      appointments.map((appointment) => this.attachPatientData(appointment)),
    );
  }

  async getTomorrowRemindersForN8n(): Promise<ReminderAppointment[]> {
    const appointments = await this.getTomorrowReminders();

    return appointments
      .filter((appointment) => appointment.patient?.email)
      .map((appointment) => ({
        email: appointment.patient?.email ?? '',
        nombre: appointment.patient?.nombre ?? 'Paciente',
        fecha: appointment.fecha,
        hora: appointment.hora,
      }));
  }

  async generateMedicalReportPdf(id: number): Promise<Buffer> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    const medicalReport =
      await this.medicalReportsService.findByAppointmentId(id);

    if (!medicalReport) {
      throw new BadRequestException(
        'Debe diligenciar y guardar el reporte clínico antes de descargar el PDF',
      );
    }

    const patient = await this.patientRepo.findOne({
      where: { userId: appointment.patientId },
    });

    const doctor = appointment.doctorId
      ? await this.doctorRepo.findOne({
          where: { id: appointment.doctorId },
        })
      : null;

    const pdfData = this.buildMedicalReportData(
      appointment,
      patient,
      doctor,
      medicalReport,
    );

    return await this.appointmentPdfService.generateMedicalReport(pdfData);
  }

  private async assignReleasedSlotToWaitlist(
    fecha: string,
    hora: string,
    releasedDuration: number,
  ): Promise<void> {
    const waitlistAppointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: 'lista_espera',
      },
      order: {
        scorePrioridad: 'DESC',
        hora: 'ASC',
      },
    });

    for (const candidate of waitlistAppointments) {
      const candidateDuration = this.getAppointmentDuration(
        candidate.appointmentClassId,
      );

      if (candidateDuration > releasedDuration) {
        continue;
      }

      try {
        this.validateBusinessSchedule(fecha, hora, candidateDuration);
      } catch {
        continue;
      }

      const available = await this.isSlotAvailable(
        fecha,
        hora,
        candidateDuration,
      );

      if (!available) {
        continue;
      }

      candidate.hora = hora;
      candidate.estado = 'confirmada';
      candidate.approvedAt = new Date();

      const savedCandidate = await this.appointmentRepo.save(candidate);
      const result = await this.attachPatientData(savedCandidate);

      this.appointmentsGateway.emitAppointmentUpdated(result);
      this.appointmentsGateway.emitQueueUpdated({
        fecha,
        message: 'Cupo liberado asignado automáticamente',
      });

      await this.sendWaitlistAssignedToN8n(result);

      return;
    }
  }

  private validateBusinessSchedule(
    fecha: string,
    hora: string,
    durationMinutes: number,
  ): void {
    const day = this.getDayOfWeek(fecha);
    const startMinutes = this.timeToMinutes(hora);

    if (day === 0 || day === 1) {
      throw new BadRequestException(
        'No se pueden agendar citas los domingos ni los lunes',
      );
    }

    if (day === 2 || day === 3) {
      const opening = this.timeToMinutes('08:00');
      const closing = this.timeToMinutes('17:40');

      if (startMinutes < opening || startMinutes > closing) {
        throw new BadRequestException(
          'Los martes y miércoles las citas inician desde las 08:00',
        );
      }
    }

    if (day === 4 || day === 5) {
      const opening = this.timeToMinutes('07:00');
      const closing = this.timeToMinutes('17:40');

      if (startMinutes < opening || startMinutes > closing) {
        throw new BadRequestException(
          'Los jueves y viernes las citas inician desde las 07:00',
        );
      }
    }

    if (day === 6) {
      const opening = this.timeToMinutes('07:00');
      const closing = this.timeToMinutes('12:40');

      if (startMinutes < opening || startMinutes > closing) {
        throw new BadRequestException(
          'Los sábados solo se pueden agendar citas hasta las 12:40',
        );
      }
    }

    void durationMinutes;
  }

  private generateAvailableHoursByDate(fecha: string): string[] {
    const day = this.getDayOfWeek(fecha);

    if (day === 0 || day === 1) {
      return [];
    }

    if (day === 2 || day === 3) {
      return this.generateHours('08:00', '17:40', 20);
    }

    if (day === 4 || day === 5) {
      return this.generateHours('07:00', '17:40', 20);
    }

    if (day === 6) {
      return this.generateHours('07:00', '12:40', 20);
    }

    return [];
  }

  private generateHours(
    start: string,
    end: string,
    stepMinutes: number,
  ): string[] {
    const hours: string[] = [];
    let current = this.timeToMinutes(start);
    const limit = this.timeToMinutes(end);

    while (current <= limit) {
      hours.push(this.minutesToTime(current));
      current += stepMinutes;
    }

    return hours;
  }

  private getBlockingStates(): string[] {
    return ['confirmada', 'aprobada', 'pendiente', 'atendida'];
  }

  private async isSlotAvailable(
    fecha: string,
    hora: string,
    durationMinutes: number,
  ): Promise<boolean> {
    const appointments = await this.appointmentRepo.find({
      where: {
        fecha,
        estado: In(this.getBlockingStates()),
      },
    });

    return !this.hasScheduleConflict(hora, durationMinutes, appointments);
  }

  private async validateAvailableSlot(
    fecha: string,
    hora: string,
    durationMinutes: number,
  ): Promise<void> {
    const available = await this.isSlotAvailable(fecha, hora, durationMinutes);

    if (!available) {
      throw new BadRequestException('Ese horario ya está ocupado');
    }
  }

  private hasScheduleConflict(
    requestedHour: string,
    requestedDuration: number,
    appointments: Appointment[],
  ): boolean {
    const requestedStart = this.timeToMinutes(requestedHour);
    const requestedEnd = requestedStart + requestedDuration;

    return appointments.some((appointment) => {
      const appointmentStart = this.timeToMinutes(appointment.hora);
      const appointmentDuration = this.getAppointmentDuration(
        appointment.appointmentClassId,
      );
      const appointmentEnd = appointmentStart + appointmentDuration;

      return requestedStart < appointmentEnd && requestedEnd > appointmentStart;
    });
  }

  private getAppointmentDuration(appointmentClassId?: number | null): number {
    switch (appointmentClassId) {
      case 1:
        return 20;
      case 2:
        return 30;
      case 3:
        return 30;
      case 4:
        return 20;
      case 5:
        return 20;
      case 6:
        return 40;
      default:
        return 20;
    }
  }

  private validateRadiologyBase(data: AppointmentInput): void {
    const RADIOLOGY_CLASS_ID = 4;

    if (data.appointmentClassId !== RADIOLOGY_CLASS_ID) {
      return;
    }

    const hasMedicalOrder =
      typeof data.ordenMedicaUrl === 'string' &&
      data.ordenMedicaUrl.trim().length > 0;

    if (!hasMedicalOrder) {
      throw new BadRequestException(
        'Para radiología se requiere una orden médica',
      );
    }
  }

  private getDayOfWeek(fecha: string): number {
    const [year, month, day] = fecha.split('-').map(Number);
    return new Date(year, month - 1, day).getDay();
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}`;
  }

  private async sendAppointmentCreatedToN8n(
    appointment: AppointmentWithPatient,
  ): Promise<void> {
    const webhookUrl =
      process.env.N8N_APPOINTMENT_CREATED_WEBHOOK_URL ??
      'http://localhost:5678/webhook/cita-creada';

    if (!appointment.patient?.email) {
      console.warn('No se pudo enviar correo de cita: paciente sin email');
      return;
    }

    try {
      await axios.post(webhookUrl, {
        email: appointment.patient.email,
        nombre: appointment.patient.nombre,
        fecha: appointment.fecha,
        hora: appointment.hora,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error enviando cita-creada a n8n:', error.message);
      } else {
        console.error('Error enviando cita-creada a n8n:', error);
      }
    }
  }

  private async sendWaitlistAssignedToN8n(
    appointment: AppointmentWithPatient,
  ): Promise<void> {
    const webhookUrl =
      process.env.N8N_WAITLIST_ASSIGNED_WEBHOOK_URL ??
      'http://localhost:5678/webhook/lista-espera-asignada';

    if (!appointment.patient?.email) {
      console.warn(
        'No se pudo enviar correo de lista de espera: paciente sin email',
      );
      return;
    }

    try {
      await axios.post(webhookUrl, {
        email: appointment.patient.email,
        nombre: appointment.patient.nombre,
        fecha: appointment.fecha,
        hora: appointment.hora,
        estado: appointment.estado,
        mensaje: 'Se liberó un cupo y tu cita fue confirmada automáticamente.',
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          'Error enviando lista-espera-asignada a n8n:',
          error.message,
        );
      } else {
        console.error('Error enviando lista-espera-asignada a n8n:', error);
      }
    }
  }

  private getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private buildMedicalReportData(
    appointment: Appointment,
    patient: Patient | null,
    doctor: Doctor | null,
    medicalReport: MedicalReport | null,
  ): MedicalReportPdfData {
    const patientRecord = patient as unknown as Record<string, unknown> | null;
    const doctorName = doctor?.nombre ?? 'No asignado';

    const specialtyName = doctor?.especialidadId
      ? `Especialidad ID ${String(doctor.especialidadId)}`
      : appointment.specialtyId
        ? `Especialidad ID ${String(appointment.specialtyId)}`
        : 'Medicina general';

    return {
      cita: {
        id: appointment.id,
        fecha: appointment.fecha,
        hora: appointment.hora,
        estado: appointment.estado,
        prioridad: appointment.prioridad ?? 'baja',
        scorePrioridad: appointment.scorePrioridad ?? 0,
        motivoConsulta: appointment.motivoConsulta ?? 'No registrado',
        explicacionPrioridad: appointment.explicacionPrioridad ?? '',
      },
      paciente: {
        nombre: patient
          ? `${patient.primerNombre} ${patient.primerApellido}`
          : 'Paciente no encontrado',
        documento: patient?.numeroDocumento ?? 'No registrado',
        telefono:
          patientRecord && typeof patientRecord['telefono'] === 'string'
            ? patientRecord['telefono']
            : 'No registrado',
        email:
          patientRecord && typeof patientRecord['email'] === 'string'
            ? patientRecord['email']
            : 'No registrado',
        eps:
          patientRecord && typeof patientRecord['eps'] === 'string'
            ? patientRecord['eps']
            : 'No registrada',
        edad: appointment.edad ?? 'No registrada',
      },
      doctor: {
        nombre: doctorName,
        especialidad: specialtyName,
      },
      historiaClinica: {
        enfermedadActual:
          medicalReport?.enfermedadActual ??
          'Pendiente de diligenciamiento médico.',
        antecedentes:
          medicalReport?.antecedentes ?? 'Sin antecedentes registrados.',
        signosVitales: medicalReport?.signosVitales ?? 'No registrados.',
        examenFisico: medicalReport?.examenFisico ?? 'No registrado.',
        diagnostico: medicalReport?.diagnostico ?? 'Pendiente.',
        tratamiento: medicalReport?.tratamiento ?? 'Pendiente.',
        observaciones: medicalReport?.observaciones ?? 'Sin observaciones.',
      },
    };
  }

  private async findDoctorBySpecialty(specialtyId: number): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({
      where: {
        especialidadId: specialtyId,
        activo: true,
      },
      order: {
        id: 'ASC',
      },
    });

    if (!doctor) {
      throw new NotFoundException(
        'No hay doctores disponibles para la especialidad seleccionada',
      );
    }

    return doctor;
  }

  private async resolveDoctorId(doctorOrUserId: number): Promise<number> {
    const doctorByUserId = await this.doctorRepo.findOne({
      where: { userId: doctorOrUserId, activo: true },
    });

    if (doctorByUserId) {
      return doctorByUserId.id;
    }

    const doctorById = await this.doctorRepo.findOne({
      where: { id: doctorOrUserId, activo: true },
    });

    if (doctorById) {
      return doctorById.id;
    }

    throw new NotFoundException('Doctor no encontrado');
  }

  private async getPrioridad(data: AppointmentInput): Promise<PriorityResult> {
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

    const report = await this.medicalReportsService.findByAppointmentId(
      appointment.id,
    );

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
      medicalReport: {
        exists: !!report,
        id: report?.id ?? null,
      },
    };
  }
}
