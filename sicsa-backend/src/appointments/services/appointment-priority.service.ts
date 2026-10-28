import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { CreateAppointmentDto } from '../dto/appointment.dto';
import { CreateAdminAppointmentDto } from '../dto/create-admin-appointment.dto';
import { getAiServiceUrl, getAiTimeoutMs } from '../../config/environment';

type AppointmentInput = CreateAppointmentDto | CreateAdminAppointmentDto;

type PriorityResult = {
  prioridad: string;
  scorePrioridad: number;
  explicacionPrioridad: string;
};

type AiPriorityResponse = {
  prioridad?: unknown;
  score?: unknown;
  explicacion?: unknown;
  alertaUrgencias?: unknown;
  mensajeUrgencias?: unknown;
  requiereRevisionHumana?: unknown;
  versionMotor?: unknown;
};

@Injectable()
export class AppointmentPriorityService {
  async getPrioridad(data: AppointmentInput): Promise<PriorityResult> {
    try {
      const response = await axios.post<AiPriorityResponse>(
        `${getAiServiceUrl()}/prioridad`,
        {
          specialtyId: data.specialtyId,
          motivoConsulta: data.motivoConsulta,
          observaciones: data.observaciones,
          edad: data.edad ?? 0,
          embarazada: data.embarazada ?? false,
          discapacidad: data.discapacidad ?? false,
          dolorIntenso: data.dolorIntenso ?? false,
          sangrado: data.sangrado ?? false,
          dificultadRespiratoria: data.dificultadRespiratoria ?? false,
          fiebre: data.fiebre ?? false,
          selectedSymptoms: data.selectedSymptoms ?? [],
          painLevel: data.painLevel,
          symptomOnset: data.symptomOnset,
        },
        { timeout: getAiTimeoutMs() },
      );

      if (!this.isValidResponse(response.data)) {
        throw new Error('Respuesta inválida del servicio de prioridad');
      }

      return {
        prioridad: response.data.prioridad,
        scorePrioridad: response.data.score,
        explicacionPrioridad: [
          response.data.explicacion,
          response.data.alertaUrgencias === true &&
          typeof response.data.mensajeUrgencias === 'string'
            ? response.data.mensajeUrgencias
            : '',
        ]
          .filter(Boolean)
          .join('. '),
      };
    } catch {
      return {
        prioridad: 'media',
        scorePrioridad: 15,
        explicacionPrioridad:
          'El servicio de priorización no estuvo disponible; la solicitud requiere revisión administrativa humana.',
      };
    }
  }

  private isValidResponse(
    response: AiPriorityResponse,
  ): response is AiPriorityResponse & {
    prioridad: string;
    score: number;
    explicacion: string;
  } {
    return (
      typeof response === 'object' &&
      response !== null &&
      ['alta', 'media', 'baja'].includes(String(response.prioridad)) &&
      typeof response.score === 'number' &&
      Number.isFinite(response.score) &&
      response.score >= 0 &&
      response.score <= 100 &&
      typeof response.explicacion === 'string' &&
      (response.alertaUrgencias === undefined ||
        typeof response.alertaUrgencias === 'boolean') &&
      (response.mensajeUrgencias === undefined ||
        response.mensajeUrgencias === null ||
        typeof response.mensajeUrgencias === 'string')
    );
  }
}
