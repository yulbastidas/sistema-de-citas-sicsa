import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

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

    @InjectRepository(MedicalReport)
    private medicalReportRepo: Repository<MedicalReport>,

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

  async attachPatientDataBatch(
    appointments: Appointment[],
  ): Promise<AppointmentWithPatient[]> {
    if (appointments.length === 0) return [];
    const patientIds = [...new Set(appointments.map((item) => item.patientId))];
    const appointmentIds = appointments.map((item) => item.id);
    const [patients, reports] = await Promise.all([
      this.patientRepo.find({ where: { userId: In(patientIds) } }),
      this.medicalReportRepo.find({
        where: { appointmentId: In(appointmentIds) },
        select: { id: true, appointmentId: true },
      }),
    ]);
    const patientByUser = new Map(patients.map((item) => [item.userId, item]));
    const reportByAppointment = new Map(
      reports.map((item) => [item.appointmentId, item]),
    );
    return appointments.map((appointment) => {
      const patient = patientByUser.get(appointment.patientId);
      const report = reportByAppointment.get(appointment.id);
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
        medicalReport: { exists: !!report, id: report?.id ?? null },
      };
    });
  }

  buildMedicalReportData(
    appointment: Appointment,
    patient: Patient | null,
    doctor: Doctor | null,
    medicalReport: MedicalReport | null,
  ): MedicalReportPdfData {
    const patientRecord = patient as unknown as Record<string, unknown> | null;
    const doctorName = doctor?.nombre ?? 'No asignado';

    const specialtyName =
      doctor?.especialidad?.nombre ??
      'Medicina general';

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
        motivoConsulta:
          medicalReport?.motivoConsulta ??
          appointment.motivoConsulta ??
          'No registrado.',

        enfermedadActual:
          medicalReport?.enfermedadActual ??
          'Pendiente de diligenciamiento médico.',

        antecedentes:
          medicalReport?.antecedentes ??
          'Sin antecedentes generales registrados.',

        antecedentesPersonales:
          medicalReport?.antecedentesPersonales ??
          'Sin antecedentes personales registrados.',

        antecedentesFamiliares:
          medicalReport?.antecedentesFamiliares ??
          'Sin antecedentes familiares registrados.',

        antecedentesQuirurgicos:
          medicalReport?.antecedentesQuirurgicos ??
          'Sin antecedentes quirúrgicos registrados.',

        antecedentesAlergicos:
          medicalReport?.antecedentesAlergicos ??
          'Sin antecedentes alérgicos registrados.',

        antecedentesFarmacologicos:
          medicalReport?.antecedentesFarmacologicos ??
          'Sin antecedentes farmacológicos registrados.',

        signosVitales:
          medicalReport?.signosVitales ??
          'Sin observaciones adicionales.',

        presionArterial:
          medicalReport?.presionArterial ?? '',

        frecuenciaCardiaca:
          medicalReport?.frecuenciaCardiaca ?? '',

        frecuenciaRespiratoria:
          medicalReport?.frecuenciaRespiratoria ?? '',

        temperatura:
          medicalReport?.temperatura ?? '',

        saturacionOxigeno:
          medicalReport?.saturacionOxigeno ?? '',

        peso:
          medicalReport?.peso ?? '',

        talla:
          medicalReport?.talla ?? '',

        imc:
          medicalReport?.imc ?? '',

        examenFisico:
          medicalReport?.examenFisico ??
          'No registrado.',

        diagnostico:
          medicalReport?.diagnostico ??
          'Pendiente.',

        codigoCie10:
          medicalReport?.codigoCie10 ?? '',

        tratamiento:
          medicalReport?.tratamiento ??
          'Pendiente.',

        recomendaciones:
          medicalReport?.recomendaciones ??
          'Sin recomendaciones registradas.',

        remision:
          medicalReport?.remision ??
          'No requiere remisión.',

        observaciones:
          medicalReport?.observaciones ??
          'Sin observaciones.',

        firmaDoctor:
          medicalReport?.firmaDoctor ??
          doctorName,
      },
    };
  }

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
