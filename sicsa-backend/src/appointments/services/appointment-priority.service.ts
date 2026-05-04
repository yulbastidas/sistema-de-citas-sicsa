import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { CreateAppointmentDto } from '../dto/appointment.dto';
import { CreateAdminAppointmentDto } from '../dto/create-admin-appointment.dto';

type AppointmentInput = CreateAppointmentDto | CreateAdminAppointmentDto;

type PriorityResult = {
  prioridad: string;
  scorePrioridad: number;
  explicacionPrioridad: string;
};

@Injectable()
export class AppointmentPriorityService {
  async getPrioridad(data: AppointmentInput): Promise<PriorityResult> {
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
}
