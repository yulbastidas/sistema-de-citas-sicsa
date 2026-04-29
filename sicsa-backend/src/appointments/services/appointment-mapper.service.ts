import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from '../entities/appointment.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { MedicalReport } from '../../medical-reports/entities/medical-report.entity';
import { MedicalReportsService } from '../../medical-reports/medical-reports.service';
import { MedicalReportPdfData } from '../pdf/appointment-pdf.service';
import { AppointmentWithPatient } from '../appointments.service';

@Injectable()
export class AppointmentMapperService {
  constructor(
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    private medicalReportsService: MedicalReportsService,
  ) {}

  async attachPatientData(
    appointment: Appointment,
  ): Promise<AppointmentWithPatient> {
    const patient = await this.patientRepo.findOne({
      where: { userId: appointment.patientId },
    });

    const report = await this.medicalReportsService.findByAppointmentId(
      appointment.id,
    );

    return {
      ...appointment,
      patient: patient
        ? {
            documento: patient.numeroDocumento,
            nombre: `${patient.primerNombre} ${patient.primerApellido}`,
            telefono: patient.telefono,
            email: patient.email,
            eps: patient.eps,
          }
        : null,
      medicalReport: {
        exists: !!report,
        id: report?.id ?? null,
      },
    };
  }

  buildMedicalReportData(
    appointment: Appointment,
    patient: Patient | null,
    doctor: Doctor | null,
    medicalReport: MedicalReport | null,
  ): MedicalReportPdfData {
    const patientRecord = patient as unknown as Record<string, unknown> | null;
    const doctorName = doctor?.nombre ?? 'No asignado';

    const specialtyName = doctor?.especialidadId
      ? `Especialidad ID ${String(doctor.especialidadId)}`
      : appointment.specialtyId
        ? `Especialidad ID ${String(appointment.specialtyId)}`
        : 'Medicina general';

    return {
      cita: {
        id: appointment.id,
        fecha: appointment.fecha,
        hora: appointment.hora,
        estado: appointment.estado,
        prioridad: appointment.prioridad ?? 'baja',
        scorePrioridad: appointment.scorePrioridad ?? 0,
        motivoConsulta: appointment.motivoConsulta ?? 'No registrado',
        explicacionPrioridad: appointment.explicacionPrioridad ?? '',
      },
      paciente: {
        nombre: patient
          ? `${patient.primerNombre} ${patient.primerApellido}`
          : 'Paciente no encontrado',
        documento: patient?.numeroDocumento ?? 'No registrado',
        telefono:
          patientRecord && typeof patientRecord['telefono'] === 'string'
            ? patientRecord['telefono']
            : 'No registrado',
        email:
          patientRecord && typeof patientRecord['email'] === 'string'
            ? patientRecord['email']
            : 'No registrado',
        eps:
          patientRecord && typeof patientRecord['eps'] === 'string'
            ? patientRecord['eps']
            : 'No registrada',
        // --- LÓGICA DE EDAD CORREGIDA ---
        edad:
          appointment.edad ??
          this.calculateAgeFromBirthDate(
            patientRecord &&
              typeof patientRecord['fechaNacimiento'] === 'string'
              ? patientRecord['fechaNacimiento']
              : null,
          ),
      },
      doctor: {
        nombre: doctorName,
        especialidad: specialtyName,
      },
      historiaClinica: {
        enfermedadActual:
          medicalReport?.enfermedadActual ??
          'Pendiente de diligenciamiento médico.',
        antecedentes:
          medicalReport?.antecedentes ?? 'Sin antecedentes registrados.',
        signosVitales: medicalReport?.signosVitales ?? 'No registrados.',
        examenFisico: medicalReport?.examenFisico ?? 'No registrado.',
        diagnostico: medicalReport?.diagnostico ?? 'Pendiente.',
        tratamiento: medicalReport?.tratamiento ?? 'Pendiente.',
        observaciones: medicalReport?.observaciones ?? 'Sin observaciones.',
      },
    };
  }

  // --- MÉTODO AUXILIAR PARA CALCULAR EDAD ---
  private calculateAgeFromBirthDate(
    fechaNacimiento: string | null,
  ): number | string {
    if (!fechaNacimiento) {
      return 'No registrada';
    }

    const birthDate = new Date(fechaNacimiento);
    const today = new Date();

    if (Number.isNaN(birthDate.getTime())) {
      return 'No registrada';
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age;
  }
}
