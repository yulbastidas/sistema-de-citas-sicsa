import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalReport } from './entities/medical-report.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UpsertMedicalReportDto } from './dto/upsert-medical-report.dto';

@Injectable()
export class MedicalReportsService {
  constructor(
    @InjectRepository(MedicalReport)
    private medicalReportRepo: Repository<MedicalReport>,

    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  async upsert(data: UpsertMedicalReportDto): Promise<MedicalReport> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: data.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    let report = await this.medicalReportRepo.findOne({
      where: { appointmentId: data.appointmentId },
    });

    if (!report) {
      report = this.medicalReportRepo.create({
        appointmentId: data.appointmentId,
      });
    }

    report.enfermedadActual = data.enfermedadActual ?? report.enfermedadActual;
    report.antecedentes = data.antecedentes ?? report.antecedentes;
    report.signosVitales = data.signosVitales ?? report.signosVitales;
    report.examenFisico = data.examenFisico ?? report.examenFisico;
    report.diagnostico = data.diagnostico ?? report.diagnostico;
    report.tratamiento = data.tratamiento ?? report.tratamiento;
    report.observaciones = data.observaciones ?? report.observaciones;
    report.firmaDoctor = data.firmaDoctor ?? report.firmaDoctor;

    const savedReport = await this.medicalReportRepo.save(report);

    appointment.estado = 'atendida';
    await this.appointmentRepo.save(appointment);

    return savedReport;
  }

  async findByAppointmentId(
    appointmentId: number,
  ): Promise<MedicalReport | null> {
    return this.medicalReportRepo.findOne({
      where: { appointmentId },
    });
  }
}
