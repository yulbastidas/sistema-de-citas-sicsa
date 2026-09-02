import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

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
import { PageRequest, pageResult } from '../common/pagination';
import { MedicalReport } from '../medical-reports/entities/medical-report.entity';

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
    private dataSource: DataSource,
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
      data.specialtyId,
    );

    this.scheduleService.validateBusinessSchedule(
      data.fecha,
      data.hora,
      duration,
    );

    this.scheduleService.validateRadiologyBase(data);

    const prioridadData = await this.priorityService.getPrioridad(data);

    const appointmentData: Partial<Appointment> = {
      patientId: user.sub,
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

    const saved = await this.reserveAppointmentAtomically(
      appointmentData,
      data.specialtyId,
      duration,
    );

    const result = await this.mapperService.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCreated(result);

    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      patientId: saved.patientId,
      doctorId: saved.doctorId,
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
      where: {
        numeroDocumento: data.documento,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const duration = this.scheduleService.getAppointmentDuration(
      data.specialtyId,
    );

    this.scheduleService.validateBusinessSchedule(
      data.fecha,
      data.hora,
      duration,
    );

    this.scheduleService.validateRadiologyBase(data);

    const prioridadData = await this.priorityService.getPrioridad(data);

    const appointmentData: Partial<Appointment> = {
      patientId: patient.userId,
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

    const saved = await this.reserveAppointmentAtomically(
      appointmentData,
      data.specialtyId,
      duration,
    );

    const result = await this.mapperService.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCreated(result);

    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      patientId: saved.patientId,
      doctorId: saved.doctorId,
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

  private applyListFilters(
    query: SelectQueryBuilder<Appointment>,
    filters: { status?: string; date?: string; search?: string },
  ) {
    if (filters.status && filters.status !== 'todos') {
      query.andWhere('LOWER(appointment.estado) = LOWER(:status)', {
        status: filters.status.trim(),
      });
    }
    if (filters.date) query.andWhere('appointment.fecha = :date', { date: filters.date });
    if (filters.search?.trim()) {
      query.leftJoin(Patient, 'listPatient', 'listPatient.userId = appointment.patientId')
        .andWhere(`(listPatient.numeroDocumento LIKE :search OR listPatient.primerNombre LIKE :search
          OR listPatient.primerApellido LIKE :search OR listPatient.email LIKE :search
          OR appointment.municipio LIKE :search)`, { search: `%${filters.search.trim()}%` });
    }
    return query;
  }

  private async paginateAppointments(query: SelectQueryBuilder<Appointment>, pagination: PageRequest) {
    const [appointments, total] = await query
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();
    const data = await this.mapperService.attachPatientDataBatch(appointments);
    return pageResult(data, total, pagination);
  }

  async findAll(pagination: PageRequest, filters: { status?: string; date?: string; search?: string }) {
    const query = this.applyListFilters(
      this.appointmentRepo.createQueryBuilder('appointment'), filters,
    ).orderBy('appointment.fecha', 'ASC').addOrderBy('appointment.hora', 'ASC');
    return this.paginateAppointments(query, pagination);
  }

  async getByUser(userId: number, pagination: PageRequest) {
    const query = this.appointmentRepo.createQueryBuilder('appointment')
      .where('appointment.patientId = :userId', { userId })
      .orderBy('appointment.fecha', 'DESC').addOrderBy('appointment.hora', 'DESC');
    return this.paginateAppointments(query, pagination);
  }

  async findByDoctor(
    doctorId: number,
    user: JwtUser,
    pagination: PageRequest,
    filters: { status?: string; date?: string },
  ) {
    const realDoctorId = await this.resolveAuthorizedDoctorId(doctorId, user);
    const query = this.applyListFilters(
      this.appointmentRepo.createQueryBuilder('appointment')
        .where('appointment.doctorId = :doctorId', { doctorId: realDoctorId }),
      filters,
    ).orderBy('appointment.fecha', 'ASC').addOrderBy('appointment.hora', 'ASC');
    return this.paginateAppointments(query, pagination);
  }

  async findHistoryByDoctor(
    doctorId: number,
    user: JwtUser,
    pagination: PageRequest,
    filters: { search?: string; date?: string },
  ) {
    const realDoctorId = await this.resolveAuthorizedDoctorId(doctorId, user);
    let query = this.appointmentRepo.createQueryBuilder('appointment')
      .leftJoin(MedicalReport, 'historyReport', 'historyReport.appointmentId = appointment.id')
      .where('appointment.doctorId = :doctorId', { doctorId: realDoctorId })
      .andWhere('(LOWER(TRIM(appointment.estado)) = :attended OR historyReport.id IS NOT NULL)', { attended: 'atendida' });
    query = this.applyListFilters(query, filters)
      .orderBy('appointment.fecha', 'DESC').addOrderBy('appointment.hora', 'DESC');
    return this.paginateAppointments(query, pagination);
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

    const transactionResult = await this.dataSource.transaction(
      async (manager) => {
        if (appointment.doctorId) {
          await manager
            .getRepository(Doctor)
            .createQueryBuilder('doctor')
            .setLock('pessimistic_write')
            .where('doctor.id = :doctorId', { doctorId: appointment.doctorId })
            .getOne();
        }

        const lockedAppointment = await manager
          .getRepository(Appointment)
          .createQueryBuilder('appointment')
          .setLock('pessimistic_write')
          .where('appointment.id = :id', { id })
          .getOne();

        if (!lockedAppointment) {
          throw new NotFoundException('Cita no encontrada');
        }

        const lockedStatus = (lockedAppointment.estado || '')
          .trim()
          .toLowerCase();

        if (lockedStatus === 'cancelada') {
          throw new BadRequestException('La cita ya se encuentra cancelada');
        }

        if (lockedStatus === 'atendida') {
          throw new BadRequestException(
            'No puedes cancelar una cita que ya fue atendida',
          );
        }

        if (lockedStatus === 'no_asistida' || lockedStatus === 'no asistida') {
          throw new BadRequestException(
            'No puedes cancelar una cita marcada como no asistida',
          );
        }

        if (
          this.getAppointmentDateTime(
            lockedAppointment.fecha,
            lockedAppointment.hora,
          ).getTime() <= Date.now()
        ) {
          throw new BadRequestException(
            'No puedes cancelar una cita cuya fecha y hora ya pasaron',
          );
        }

        const releasedDuration =
          this.scheduleService.getAppointmentDurationBySpecialty(
            lockedAppointment.specialtyId,
          );
        const shouldPromote =
          !!lockedAppointment.doctorId &&
          !!lockedAppointment.specialtyId &&
          this.scheduleService.getBlockingStates().includes(lockedStatus);

        lockedAppointment.estado = 'cancelada';
        const savedAppointment = await manager
          .getRepository(Appointment)
          .save(lockedAppointment);

        const promoted = shouldPromote
          ? await this.waitlistService.assignReleasedSlotToWaitlist(
              manager,
              lockedAppointment.fecha,
              lockedAppointment.hora,
              releasedDuration,
              lockedAppointment.doctorId,
              lockedAppointment.specialtyId,
            )
          : null;

        return { savedAppointment, promoted };
      },
    );

    const saved = transactionResult.savedAppointment;

    const result = await this.mapperService.attachPatientData(saved);

    this.appointmentsGateway.emitAppointmentCancelled(result);

    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      patientId: saved.patientId,
      doctorId: saved.doctorId,
      message: 'Cola actualizada',
    });

    if (transactionResult.promoted) {
      await this.waitlistService.notifyAssignmentAfterCommit(
        transactionResult.promoted,
      );
    }

    return result;
  }

  /**
   * Marca una cita confirmada como inasistencia.
   *
   * Solo un médico asignado a la cita o un administrador
   * pueden realizar esta acción.
   */
  async markNoShow(id: number, user: JwtUser): Promise<AppointmentWithPatient> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    /*
     * Cuando la acción la realiza un médico,
     * verificamos que la cita le pertenezca.
     */
    if (user.role === 'doctor') {
      const realDoctorId = await this.resolveDoctorId(user.sub);

      if (appointment.doctorId !== realDoctorId) {
        throw new BadRequestException(
          'No puedes marcar la inasistencia de una cita asignada a otro médico',
        );
      }
    }

    const currentStatus = (appointment.estado || '').trim().toLowerCase();

    if (
      currentStatus === 'no asistida' ||
      currentStatus === 'no_asistida' ||
      currentStatus === 'no-asistida' ||
      currentStatus === 'inasistencia' ||
      currentStatus === 'no asistio' ||
      currentStatus === 'no asistió'
    ) {
      throw new BadRequestException(
        'La cita ya está marcada como inasistencia',
      );
    }

    if (
      currentStatus === 'atendida' ||
      currentStatus === 'atendido' ||
      currentStatus === 'completada' ||
      currentStatus === 'completado'
    ) {
      throw new BadRequestException(
        'No puedes marcar como inasistencia una cita que ya fue atendida',
      );
    }

    if (currentStatus === 'cancelada' || currentStatus === 'cancelado') {
      throw new BadRequestException(
        'No puedes marcar como inasistencia una cita cancelada',
      );
    }

    if (currentStatus !== 'confirmada') {
      throw new BadRequestException(
        'Solo las citas confirmadas pueden marcarse como inasistencia',
      );
    }

    const appointmentDateTime = this.getAppointmentDateTime(
      appointment.fecha,
      appointment.hora,
    );

    if (appointmentDateTime.getTime() > Date.now()) {
      throw new BadRequestException(
        'No puedes marcar una inasistencia antes de la fecha y hora de la cita',
      );
    }

    appointment.estado = 'no asistida';

    const saved = await this.appointmentRepo.save(appointment);

    const result = await this.mapperService.attachPatientData(saved);

    this.appointmentsGateway.emitQueueUpdated({
      fecha: saved.fecha,
      patientId: saved.patientId,
      doctorId: saved.doctorId,
      message: 'Cita marcada como inasistencia',
    });

    return result;
  }

  async getAvailable(fecha: string, specialtyId?: number): Promise<string[]> {
    const doctors = specialtyId
      ? await this.doctorRepo.find({
          where: { especialidadId: specialtyId, activo: true },
          order: { id: 'ASC' },
        })
      : [];

    if (specialtyId && doctors.length === 0) {
      return [];
    }

    return this.scheduleService.getAvailableHours(
      fecha,
      specialtyId,
      doctors.map((doctor) => doctor.id),
    );
  }

  async getQueue(
    fecha: string,
    doctorId?: number,
    user?: JwtUser,
  ): Promise<AppointmentWithPatient[]> {
    let authorizedDoctorId: number | undefined;

    if (user?.role === 'doctor') {
      authorizedDoctorId = doctorId
        ? await this.resolveAuthorizedDoctorId(doctorId, user)
        : await this.resolveDoctorId(user.sub);
    } else if (doctorId) {
      authorizedDoctorId = await this.resolveDoctorId(doctorId);
    }

    if (authorizedDoctorId) {
      const appointments = await this.appointmentRepo.find({
        where: {
          fecha,
          doctorId: authorizedDoctorId,
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

  async generateMedicalReportPdf(id: number, user: JwtUser): Promise<Buffer> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    await this.assertDoctorOwnsAppointment(appointment, user);

    const medicalReport = await this.medicalReportsService.findByAppointmentId(
      id,
      user,
    );

    if (!medicalReport) {
      throw new BadRequestException(
        'Debe diligenciar y guardar el reporte clínico antes de descargar el PDF',
      );
    }

    const patient = await this.patientRepo.findOne({
      where: {
        userId: appointment.patientId,
      },
    });

    const doctor = appointment.doctorId
      ? await this.doctorRepo.findOne({
          where: {
            id: appointment.doctorId,
          },
          relations: {
            especialidad: true,
          },
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

  private async reserveAppointmentAtomically(
    appointmentData: Partial<Appointment>,
    specialtyId: number,
    duration: number,
  ): Promise<Appointment> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const doctors = await this.lockActiveDoctorsBySpecialty(
          manager,
          specialtyId,
        );

        if (!doctors.length) {
          throw new NotFoundException(
            'No hay doctores disponibles para la especialidad seleccionada',
          );
        }

        const appointmentRepository = manager.getRepository(Appointment);
        let assignedDoctor: Doctor | undefined;

        for (const doctor of doctors) {
          const available = await this.scheduleService.isSlotAvailable(
            doctor.id,
            appointmentData.fecha!,
            appointmentData.hora!,
            duration,
            appointmentRepository,
          );

          if (available) {
            assignedDoctor = doctor;
            break;
          }
        }

        const appointment = appointmentRepository.create({
          ...appointmentData,
          doctorId: assignedDoctor?.id ?? doctors[0].id,
          estado: assignedDoctor ? 'confirmada' : 'lista_espera',
        });

        return appointmentRepository.save(appointment);
      });
    } catch (error) {
      if (this.isDatabaseContention(error)) {
        throw new ConflictException(
          'El horario está siendo reservado. Intenta nuevamente.',
        );
      }

      throw error;
    }
  }

  private lockActiveDoctorsBySpecialty(
    manager: EntityManager,
    specialtyId: number,
  ): Promise<Doctor[]> {
    return manager
      .getRepository(Doctor)
      .createQueryBuilder('doctor')
      .setLock('pessimistic_write')
      .where('doctor.especialidadId = :specialtyId', { specialtyId })
      .andWhere('doctor.activo = :active', { active: true })
      .orderBy('doctor.id', 'ASC')
      .getMany();
  }

  private isDatabaseContention(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const databaseError = error as { code?: string; errno?: number };

    return (
      databaseError.code === 'ER_LOCK_DEADLOCK' ||
      databaseError.code === 'ER_LOCK_WAIT_TIMEOUT' ||
      databaseError.errno === 1213 ||
      databaseError.errno === 1205
    );
  }

  private async resolveDoctorId(doctorOrUserId: number): Promise<number> {
    const doctorByUserId = await this.doctorRepo.findOne({
      where: {
        userId: doctorOrUserId,
        activo: true,
      },
    });

    if (doctorByUserId) {
      return doctorByUserId.id;
    }

    const doctorById = await this.doctorRepo.findOne({
      where: {
        id: doctorOrUserId,
        activo: true,
      },
    });

    if (doctorById) {
      return doctorById.id;
    }

    throw new NotFoundException('Doctor no encontrado');
  }

  private async resolveAuthorizedDoctorId(
    doctorOrUserId: number,
    user: JwtUser,
  ): Promise<number> {
    if (user.role !== 'doctor') {
      return this.resolveDoctorId(doctorOrUserId);
    }

    const authenticatedDoctorId = await this.resolveDoctorId(user.sub);

    if (
      doctorOrUserId !== user.sub &&
      doctorOrUserId !== authenticatedDoctorId
    ) {
      throw new ForbiddenException(
        'No tienes permiso para consultar información de otro médico',
      );
    }

    return authenticatedDoctorId;
  }

  private async assertDoctorOwnsAppointment(
    appointment: Appointment,
    user: JwtUser,
  ): Promise<void> {
    if (user.role !== 'doctor') {
      return;
    }

    const authenticatedDoctorId = await this.resolveDoctorId(user.sub);

    if (appointment.doctorId !== authenticatedDoctorId) {
      throw new ForbiddenException(
        'No tienes permiso para consultar este recurso clínico',
      );
    }
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
