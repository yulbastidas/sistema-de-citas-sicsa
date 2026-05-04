import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from '../entities/appointment.entity';
import { AppointmentScheduleService } from './appointment-schedule.service';
import { AppointmentNotificationService } from './appointment-notification.service';
import { AppointmentMapperService } from './appointment-mapper.service';
import { AppointmentsGateway } from '../appointments.gateway';

@Injectable()
export class AppointmentWaitlistService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    private scheduleService: AppointmentScheduleService,
    private notificationService: AppointmentNotificationService,
    private mapperService: AppointmentMapperService,
    private appointmentsGateway: AppointmentsGateway,
  ) {}

  async assignReleasedSlotToWaitlist(
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
      const candidateDuration = this.scheduleService.getAppointmentDuration(
        candidate.appointmentClassId,
      );

      if (candidateDuration > releasedDuration) {
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
        fecha,
        hora,
        candidateDuration,
      );

      if (!available) {
        continue;
      }

      candidate.hora = hora;
      candidate.estado = 'confirmada';

      const savedCandidate = await this.appointmentRepo.save(candidate);
      const result = await this.mapperService.attachPatientData(savedCandidate);

      this.appointmentsGateway.emitAppointmentUpdated(result);
      this.appointmentsGateway.emitQueueUpdated({
        fecha,
        message: 'Cupo liberado asignado automáticamente',
      });

      await this.notificationService.sendWaitlistAssignedToN8n(result);

      return;
    }
  }
}
