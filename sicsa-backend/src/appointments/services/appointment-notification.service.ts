import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { AppointmentWithPatient } from '../appointments.service';
import { getOptionalEnvironmentUrl } from '../../config/environment';

type ReminderAppointment = {
  email: string;
  nombre: string;
  fecha: string;
  hora: string;
};

@Injectable()
export class AppointmentNotificationService {
  private readonly timeoutMs = Number(process.env.N8N_TIMEOUT_MS || 5000);

  async sendAppointmentCreatedToN8n(
    appointment: AppointmentWithPatient,
  ): Promise<void> {
    const webhookUrl = getOptionalEnvironmentUrl(
      'N8N_APPOINTMENT_CREATED_WEBHOOK_URL',
    );

    if (!webhookUrl) {
      console.warn('Webhook de cita creada no configurado');
      return;
    }

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
        idempotencyKey: `appointment-created:${appointment.id}`,
      }, {
        timeout: this.timeoutMs,
        headers: { 'Idempotency-Key': `appointment-created:${appointment.id}` },
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
    const webhookUrl = getOptionalEnvironmentUrl(
      'N8N_WAITLIST_ASSIGNED_WEBHOOK_URL',
    );

    if (!webhookUrl) {
      console.warn('Webhook de lista de espera no configurado');
      return;
    }

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
        idempotencyKey: `waitlist-assigned:${appointment.id}`,
      }, {
        timeout: this.timeoutMs,
        headers: { 'Idempotency-Key': `waitlist-assigned:${appointment.id}` },
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
