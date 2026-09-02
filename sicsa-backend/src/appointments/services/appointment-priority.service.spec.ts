import axios from 'axios';
import { AppointmentPriorityService } from './appointment-priority.service';

jest.mock('axios');

describe('AppointmentPriorityService', () => {
  const service = new AppointmentPriorityService();
  const mockedAxios = jest.mocked(axios);
  const appointment = {
    fecha: '2026-09-01',
    hora: '09:00',
    motivoConsulta: 'Dolor moderado',
    specialtyId: 13,
  };

  beforeEach(() => {
    process.env.AI_SERVICE_URL = 'http://ai.test:8000';
    process.env.AI_TIMEOUT_MS = '1500';
    mockedAxios.post.mockReset();
  });

  it('uses the configured service and returns a valid response', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        prioridad: 'media',
        score: 20,
        explicacion: 'Requiere revisión',
      },
    });

    await expect(service.getPrioridad(appointment)).resolves.toEqual({
      prioridad: 'media',
      scorePrioridad: 20,
      explicacionPrioridad: 'Requiere revisión',
    });

    expect(mockedAxios.post.mock.calls[0]).toEqual([
      'http://ai.test:8000/prioridad',
      expect.objectContaining({ specialtyId: 13 }),
      { timeout: 1500 },
    ]);
  });

  it('uses the safe fallback when the service is unavailable', async () => {
    mockedAxios.post.mockRejectedValue(new Error('connection refused'));

    await expect(service.getPrioridad(appointment)).resolves.toEqual({
      prioridad: 'baja',
      scorePrioridad: 0,
      explicacionPrioridad: '',
    });
  });

  it('uses the safe fallback when the request times out', async () => {
    mockedAxios.post.mockRejectedValue(
      Object.assign(new Error('timeout'), {
        code: 'ECONNABORTED',
      }),
    );

    await expect(service.getPrioridad(appointment)).resolves.toEqual({
      prioridad: 'baja',
      scorePrioridad: 0,
      explicacionPrioridad: '',
    });
  });

  it('rejects an invalid AI response and uses the safe fallback', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        prioridad: 'urgente',
        score: 'alto',
        explicacion: null,
      },
    });

    await expect(service.getPrioridad(appointment)).resolves.toEqual({
      prioridad: 'baja',
      scorePrioridad: 0,
      explicacionPrioridad: '',
    });
  });
});
