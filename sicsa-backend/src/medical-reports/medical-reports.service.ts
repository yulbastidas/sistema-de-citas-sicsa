import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MedicalReport } from './entities/medical-report.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UpsertMedicalReportDto } from './dto/upsert-medical-report.dto';
import { Doctor } from '../doctors/entities/doctor.entity';

type AuthenticatedUser = {
  sub: number;
  role: string;
  email: string;
};

@Injectable()
export class MedicalReportsService {
  constructor(
    @InjectRepository(MedicalReport)
    private readonly medicalReportRepo: Repository<MedicalReport>,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  async upsert(
    data: UpsertMedicalReportDto,
    user: AuthenticatedUser,
  ): Promise<MedicalReport> {
    const appointment = await this.appointmentRepo.findOne({
      where: {
        id: data.appointmentId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    await this.assertDoctorOwnsAppointment(appointment, user);

    let report = await this.medicalReportRepo.findOne({
      where: {
        appointmentId: data.appointmentId,
      },
    });

    if (!report) {
      report = this.medicalReportRepo.create({
        appointmentId: data.appointmentId,
      });
    }

    /**
     * Información general.
     */
    report.motivoConsulta = data.motivoConsulta ?? report.motivoConsulta;

    report.enfermedadActual = data.enfermedadActual ?? report.enfermedadActual;

    /**
     * Campos antiguos.
     *
     * Se conservan para mantener compatibilidad con los
     * reportes clínicos que ya existían.
     */
    report.antecedentes = data.antecedentes ?? report.antecedentes;

    report.signosVitales = data.signosVitales ?? report.signosVitales;

    /**
     * Antecedentes clínicos estructurados.
     */
    report.antecedentesPersonales =
      data.antecedentesPersonales ?? report.antecedentesPersonales;

    report.antecedentesFamiliares =
      data.antecedentesFamiliares ?? report.antecedentesFamiliares;

    report.antecedentesQuirurgicos =
      data.antecedentesQuirurgicos ?? report.antecedentesQuirurgicos;

    report.antecedentesAlergicos =
      data.antecedentesAlergicos ?? report.antecedentesAlergicos;

    report.antecedentesFarmacologicos =
      data.antecedentesFarmacologicos ?? report.antecedentesFarmacologicos;

    /**
     * Signos vitales estructurados.
     */
    report.presionArterial = data.presionArterial ?? report.presionArterial;

    report.frecuenciaCardiaca =
      data.frecuenciaCardiaca ?? report.frecuenciaCardiaca;

    report.frecuenciaRespiratoria =
      data.frecuenciaRespiratoria ?? report.frecuenciaRespiratoria;

    report.temperatura = data.temperatura ?? report.temperatura;

    report.saturacionOxigeno =
      data.saturacionOxigeno ?? report.saturacionOxigeno;

    report.peso = data.peso ?? report.peso;

    report.talla = data.talla ?? report.talla;

    report.imc = data.imc ?? report.imc;

    /**
     * Valoración médica.
     */
    report.examenFisico = data.examenFisico ?? report.examenFisico;

    report.diagnostico = data.diagnostico ?? report.diagnostico;

    report.codigoCie10 = data.codigoCie10 ?? report.codigoCie10;

    /**
     * Conducta y plan médico.
     */
    report.tratamiento = data.tratamiento ?? report.tratamiento;

    report.recomendaciones = data.recomendaciones ?? report.recomendaciones;

    report.remision = data.remision ?? report.remision;

    report.observaciones = data.observaciones ?? report.observaciones;

    report.firmaDoctor = data.firmaDoctor ?? report.firmaDoctor;

    const savedReport = await this.medicalReportRepo.save(report);

    /**
     * Cuando el médico guarda el reporte, la cita queda
     * registrada como atendida.
     */
    appointment.estado = 'atendida';

    await this.appointmentRepo.save(appointment);

    return savedReport;
  }

  async findByAppointmentId(
    appointmentId: number,
    user?: AuthenticatedUser,
  ): Promise<MedicalReport | null> {
    const appointment = await this.appointmentRepo.findOne({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (user) {
      await this.assertDoctorOwnsAppointment(appointment, user);
    }

    return this.medicalReportRepo.findOne({
      where: {
        appointmentId,
      },
    });
  }

  private async assertDoctorOwnsAppointment(
    appointment: Appointment,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (user.role !== 'doctor') {
      return;
    }

    const doctor = await this.doctorRepo.findOne({
      where: {
        userId: user.sub,
        activo: true,
      },
    });

    if (!doctor || appointment.doctorId !== doctor.id) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este reporte clínico',
      );
    }
  }
}
