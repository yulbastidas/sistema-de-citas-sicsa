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
        },
        { timeout: getAiTimeoutMs() },
      );

      if (!this.isValidResponse(response.data)) {
        throw new Error('Respuesta inválida del servicio de prioridad');
      }

      return {
        prioridad: response.data.prioridad,
        scorePrioridad: response.data.score,
        explicacionPrioridad: response.data.explicacion,
      };
    } catch {
      return {
        prioridad: 'baja',
        scorePrioridad: 0,
        explicacionPrioridad: '',
      };
    }
  }

  private isValidResponse(
    response: AiPriorityResponse,
  ): response is { prioridad: string; score: number; explicacion: string } {
    return (
      typeof response === 'object' &&
      response !== null &&
      ['alta', 'media', 'baja'].includes(String(response.prioridad)) &&
      typeof response.score === 'number' &&
      Number.isFinite(response.score) &&
      response.score >= 0 &&
      response.score <= 100 &&
      typeof response.explicacion === 'string'
    );
  }
}
