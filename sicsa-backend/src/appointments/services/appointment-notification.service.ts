import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { AppointmentWithPatient } from '../appointments.service';

type ReminderAppointment = {
  email: string;
  nombre: string;
  fecha: string;
  hora: string;
};

@Injectable()
export class AppointmentNotificationService {
  async sendAppointmentCreatedToN8n(
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

  async sendWaitlistAssignedToN8n(
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

  buildReminderPayload(
    appointments: AppointmentWithPatient[],
  ): ReminderAppointment[] {
    return appointments
      .filter((appointment) => appointment.patient?.email)
      .map((appointment) => ({
        email: appointment.patient?.email ?? '',
        nombre: appointment.patient?.nombre ?? 'Paciente',
        fecha: appointment.fecha,
        hora: appointment.hora,
      }));
  }
}
