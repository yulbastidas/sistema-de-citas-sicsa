import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Appointment } from '../entities/appointment.entity';
import { AppointmentScheduleService } from './appointment-schedule.service';
import { AppointmentNotificationService } from './appointment-notification.service';
import { AppointmentMapperService } from './appointment-mapper.service';
import { AppointmentsGateway } from '../appointments.gateway';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AppointmentWaitlistService {
  constructor(
    private scheduleService: AppointmentScheduleService,
    private notificationService: AppointmentNotificationService,
    private mapperService: AppointmentMapperService,
    private appointmentsGateway: AppointmentsGateway,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async assignReleasedSlotToWaitlist(
    manager: EntityManager,
    fecha: string,
    hora: string,
    releasedDuration: number,
    doctorId: number,
    specialtyId: number,
  ): Promise<Appointment | null> {
    const appointmentRepository = manager.getRepository(Appointment);
    const waitlistAppointments = await appointmentRepository
      .createQueryBuilder('appointment')
      .setLock('pessimistic_write')
      .where('appointment.fecha = :fecha', { fecha })
      .andWhere('appointment.estado = :status', { status: 'lista_espera' })
      .andWhere('appointment.specialtyId = :specialtyId', { specialtyId })
      .orderBy('appointment.scorePrioridad', 'DESC')
      .addOrderBy('appointment.hora', 'ASC')
      .addOrderBy('appointment.id', 'ASC')
      .getMany();

    for (const candidate of waitlistAppointments) {
      const candidateDuration =
        this.scheduleService.getAppointmentDurationBySpecialty(
          candidate.specialtyId,
        );

      if (
        candidate.specialtyId !== specialtyId ||
        candidateDuration > releasedDuration
      ) {
        continue;
      }

      try {
        this.scheduleService.validateBusinessSchedule(
          fecha,
          hora,
          candidateDuration,
        );
      } catch {
        continue;
      }

      const available = await this.scheduleService.isSlotAvailable(
        doctorId,
        fecha,
        hora,
        candidateDuration,
        appointmentRepository,
      );

      if (!available) {
        continue;
      }

      candidate.doctorId = doctorId;
      candidate.hora = hora;
      candidate.estado = 'confirmada';

      return appointmentRepository.save(candidate);
    }

    return null;
  }

  async notifyAssignmentAfterCommit(candidate: Appointment): Promise<void> {
    const result = await this.mapperService.attachPatientData(candidate);

    this.appointmentsGateway.emitAppointmentUpdated(result);
    this.appointmentsGateway.emitQueueUpdated({
      fecha: candidate.fecha,
      patientId: candidate.patientId,
      doctorId: candidate.doctorId,
      message: 'Cupo liberado asignado automáticamente',
    });

    await this.audit?.record({
      actorRole: 'system',
      action: 'appointment.waitlist_promoted',
      resourceType: 'appointment',
      resourceId: candidate.id,
      result: 'success',
      metadata: { status: candidate.estado },
    });

    await this.notificationService.sendWaitlistAssignedToN8n(result);
  }
}
