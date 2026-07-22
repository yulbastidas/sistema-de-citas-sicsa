import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from './entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { CreateAdminAppointmentDto } from './dto/create-admin-appointment.dto';
import { AppointmentsGateway } from './appointments.gateway';
import { AppointmentPdfService } from './pdf/appointment-pdf.service';
import { MedicalReportsService } from '../medical-reports/medical-reports.service';

import { AppointmentScheduleService } from './services/appointment-schedule.service';
import { AppointmentPriorityService } from './services/appointment-priority.service';
import { AppointmentNotificationService } from './services/appointment-notification.service';
import { AppointmentMapperService } from './services/appointment-mapper.service';
import { AppointmentWaitlistService } from './services/appointment-waitlist.service';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

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

    private scheduleService: AppointmentScheduleService,
    private priorityService: AppointmentPriorityService,
    private notificationService: AppointmentNotificationService,
    private mapperService: AppointmentMapperService,
    private waitlistService: AppointmentWaitlistService,
  ) {}

  async create(
    data: CreateAppointmentDto,
    user: JwtUser,
  ): Promise<AppointmentWithPatient> {
    const patient = await this.patientRepo.findOne({
      where: { userId: user.sub },
    });

    if (!patient) {
      throw new NotFoundException('Perfil de paciente no encontrado');
    }

    const duration = this.scheduleService.getAppointmentDuration(
      data.appointmentClassId,
    );

    this.scheduleService.validateBusinessSchedule(
      data.fecha,
      data.hora,
      duration,
    );
    this.scheduleService.validateRadiologyBase(data);

    const slotAvailable = await this.scheduleService.isSlotAvailable(
      data.fecha,
      data.hora,
      duration,
    );

    const appointmentStatus = slotAvailable ? 'confirmada' : 'lista_espera';

    const assignedDoctor = await this.findDoctorBySpecialty(data.specialtyId);
    const prioridadData = await this.priorityService.getPrioridad(data);

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
      eps: patient.eps,
      epsId: patient.epsId,
      departamento: patient.departamento,
      municipio: patient.municipio,

      appointmentClassId: data.appointmentClassId,
      observaciones: data.observaciones,
      ordenMedicaUrl: data.ordenMedicaUrl,
    };

    const appointment = this.appointmentRepo.create(appointmentData);
    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.mapperService.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCreated(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message:
        saved.estado === 'lista_espera'
          ? 'Cita agregada a lista de espera'
          : 'Cola actualizada',
    });

    if (saved.estado === 'confirmada') {
      await this.notificationService.sendAppointmentCreatedToN8n(result);
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

    const duration = this.scheduleService.getAppointmentDuration(
      data.appointmentClassId,
    );

    this.scheduleService.validateBusinessSchedule(
      data.fecha,
      data.hora,
      duration,
    );
    this.scheduleService.validateRadiologyBase(data);

    const slotAvailable = await this.scheduleService.isSlotAvailable(
      data.fecha,
      data.hora,
      duration,
    );

    const appointmentStatus = slotAvailable ? 'confirmada' : 'lista_espera';

    const assignedDoctor = await this.findDoctorBySpecialty(data.specialtyId);
    const prioridadData = await this.priorityService.getPrioridad(data);

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
    };

    const appointment = this.appointmentRepo.create(appointmentData);
    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.mapperService.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCreated(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message:
        saved.estado === 'lista_espera'
          ? 'Cita agregada a lista de espera'
          : 'Cola actualizada',
    });

    if (saved.estado === 'confirmada') {
      await this.notificationService.sendAppointmentCreatedToN8n(result);
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
      appointments.map((appointment) =>
        this.mapperService.attachPatientData(appointment),
      ),
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
      appointments.map((appointment) =>
        this.mapperService.attachPatientData(appointment),
      ),
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
      appointments.map((appointment) =>
        this.mapperService.attachPatientData(appointment),
      ),
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
      appointments.map((appointment) =>
        this.mapperService.attachPatientData(appointment),
      ),
    );

    return enrichedAppointments.filter(
      (appointment) =>
        appointment.estado?.toLowerCase() === 'atendida' ||
        appointment.medicalReport?.exists,
    );
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

    const currentStatus = (appointment.estado || '').trim().toLowerCase();

    if (currentStatus === 'cancelada') {
      throw new BadRequestException('La cita ya se encuentra cancelada');
    }

    if (currentStatus === 'atendida') {
      throw new BadRequestException(
        'No puedes cancelar una cita que ya fue atendida',
      );
    }

    if (currentStatus === 'no_asistida' || currentStatus === 'no asistida') {
      throw new BadRequestException(
        'No puedes cancelar una cita marcada como no asistida',
      );
    }

    const appointmentDateTime = this.getAppointmentDateTime(
      appointment.fecha,
      appointment.hora,
    );

    if (appointmentDateTime.getTime() <= Date.now()) {
      throw new BadRequestException(
        'No puedes cancelar una cita cuya fecha y hora ya pasaron',
      );
    }

    const releasedFecha = appointment.fecha;
    const releasedHora = appointment.hora;
    const releasedDuration = this.scheduleService.getAppointmentDuration(
      appointment.appointmentClassId,
    );

    appointment.estado = 'cancelada';

    const saved = await this.appointmentRepo.save(appointment);
    const result = await this.mapperService.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCancelled(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      message: 'Cola actualizada',
    });

    await this.waitlistService.assignReleasedSlotToWaitlist(
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
    return this.scheduleService.getAvailableHours(fecha, appointmentClassId);
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
        appointments.map((appointment) =>
          this.mapperService.attachPatientData(appointment),
        ),
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
      appointments.map((appointment) =>
        this.mapperService.attachPatientData(appointment),
      ),
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
      appointments.map((appointment) =>
        this.mapperService.attachPatientData(appointment),
      ),
    );
  }

  async getTomorrowRemindersForN8n(): Promise<ReminderAppointment[]> {
    const appointments = await this.getTomorrowReminders();
    return this.notificationService.buildReminderPayload(appointments);
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

    const pdfData = this.mapperService.buildMedicalReportData(
      appointment,
      patient,
      doctor,
      medicalReport,
    );

    return await this.appointmentPdfService.generateMedicalReport(pdfData);
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

  private getAppointmentDateTime(fecha: string, hora: string): Date {
    const normalizedFecha = fecha?.trim();
    let normalizedHora = hora?.trim();

    if (!normalizedFecha || !normalizedHora) {
      throw new BadRequestException('La cita no tiene una fecha u hora válida');
    }

    if (/^\d{2}:\d{2}$/.test(normalizedHora)) {
      normalizedHora = `${normalizedHora}:00`;
    }

    const appointmentDateTime = new Date(
      `${normalizedFecha}T${normalizedHora}-05:00`,
    );

    if (Number.isNaN(appointmentDateTime.getTime())) {
      throw new BadRequestException(
        'La fecha u hora de la cita no tiene un formato válido',
      );
    }

    return appointmentDateTime;
  }

  private getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
