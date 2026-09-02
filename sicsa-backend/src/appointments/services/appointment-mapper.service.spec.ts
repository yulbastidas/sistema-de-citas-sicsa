import { AppointmentMapperService } from './appointment-mapper.service';

describe('AppointmentMapperService batch enrichment', () => {
  it('loads patients and reports once per page instead of once per appointment', async () => {
    const patients = {
      find: jest.fn().mockResolvedValue([
        { userId: 10, numeroDocumento: '1', primerNombre: 'Ana', primerApellido: 'Paz', telefono: 'x', email: 'a@test', eps: 'EPS' },
      ]),
    };
    const reports = {
      find: jest.fn().mockResolvedValue([{ id: 7, appointmentId: 2 }]),
    };
    const service = new AppointmentMapperService(
      patients as never,
      reports as never,
      {} as never,
    );
    const data = await service.attachPatientDataBatch([
      { id: 1, patientId: 10 } as never,
      { id: 2, patientId: 10 } as never,
    ]);

    expect(patients.find).toHaveBeenCalledTimes(1);
    expect(reports.find).toHaveBeenCalledTimes(1);
    expect(data[0].patient?.nombre).toBe('Ana Paz');
    expect(data[1].medicalReport).toEqual({ exists: true, id: 7 });
  });
});
