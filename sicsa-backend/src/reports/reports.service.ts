import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Specialty } from '../specialties/entities/specialty.entity';
import { ReportFiltersDto } from './dto/report-filters.dto';

type ReportQueryBuilder = SelectQueryBuilder<Appointment>;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  /**
   * Aplica los filtros comunes a todas las consultas
   * del módulo de reportes.
   */
  private applyFilters(
    query: ReportQueryBuilder,
    filters: ReportFiltersDto,
  ): ReportQueryBuilder {
    if (filters.startDate) {
      query.andWhere('appointment.fecha >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere('appointment.fecha <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.specialtyId) {
      query.andWhere(
        'appointment.specialtyId = :specialtyId',
        {
          specialtyId: filters.specialtyId,
        },
      );
    }

    if (filters.doctorId) {
      query.andWhere(
        'appointment.doctorId = :doctorId',
        {
          doctorId: filters.doctorId,
        },
      );
    }

    if (filters.patientId) {
      query.andWhere(
        'appointment.patientId = :patientId',
        {
          patientId: filters.patientId,
        },
      );
    }

    if (filters.status) {
      query.andWhere(
        `
        LOWER(TRIM(appointment.estado))
        =
        LOWER(TRIM(:status))
        `,
        {
          status: filters.status,
        },
      );
    }

    if (filters.priority) {
      query.andWhere(
        `
        LOWER(TRIM(appointment.prioridad))
        =
        LOWER(TRIM(:priority))
        `,
        {
          priority: filters.priority,
        },
      );
    }

    if (filters.eps) {
      query.andWhere(
        'LOWER(appointment.eps) LIKE LOWER(:eps)',
        {
          eps: `%${filters.eps.trim()}%`,
        },
      );
    }

    if (filters.municipality) {
      query.andWhere(
        `
        LOWER(appointment.municipio)
        LIKE LOWER(:municipality)
        `,
        {
          municipality: `%${filters.municipality.trim()}%`,
        },
      );
    }

    return query;
  }

  /**
   * Consulta base para relacionar las citas con pacientes,
   * médicos y especialidades.
   *
   * Se realizan cruces manuales porque las entidades actuales
   * almacenan los identificadores directamente.
   */
  private createBaseQuery(): ReportQueryBuilder {
    return this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoin(
        Patient,
        'patient',
        'patient.userId = appointment.patientId',
      )
      .leftJoin(
        Doctor,
        'doctor',
        'doctor.id = appointment.doctorId',
      )
      .leftJoin(
        Specialty,
        'specialty',
        'specialty.id = appointment.specialtyId',
      );
  }

  /**
   * Reconoce las diferentes formas en las que puede estar
   * almacenado el estado de una inasistencia.
   */
  private noShowCondition(): string {
    return `
      LOWER(TRIM(appointment.estado)) IN (
        'no asistida',
        'no_asistida',
        'no-asistida',
        'inasistencia',
        'no asistio',
        'no asistió'
      )
    `;
  }

  /**
   * Reconoce los estados que indican una cita atendida.
   */
  private attendedCondition(): string {
    return `
      LOWER(TRIM(appointment.estado)) IN (
        'atendida',
        'atendido',
        'completada',
        'completado'
      )
    `;
  }

  /**
   * Reconoce los estados que indican una cita cancelada.
   */
  private cancelledCondition(): string {
    return `
      LOWER(TRIM(appointment.estado)) IN (
        'cancelada',
        'cancelado'
      )
    `;
  }

  /**
   * Reconoce los estados que indican una cita confirmada.
   */
  private confirmedCondition(): string {
    return `
      LOWER(TRIM(appointment.estado)) IN (
        'confirmada',
        'confirmado'
      )
    `;
  }

  /**
   * Reconoce las citas solicitadas o pendientes.
   */
  private pendingCondition(): string {
    return `
      LOWER(TRIM(appointment.estado)) IN (
        'pendiente',
        'solicitada',
        'solicitado'
      )
    `;
  }

  /**
   * Obtiene los indicadores y agrupaciones necesarios
   * para mostrar el dashboard de reportes.
   */
  async getDashboard(filters: ReportFiltersDto) {
    const summaryQuery = this.applyFilters(
      this.createBaseQuery(),
      filters,
    );

    const summaryRaw = await summaryQuery
      .select(
        'COUNT(appointment.id)',
        'totalAppointments',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN ${this.attendedCondition()}
            THEN 1
            ELSE 0
          END
        )
        `,
        'attended',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN ${this.cancelledCondition()}
            THEN 1
            ELSE 0
          END
        )
        `,
        'cancelled',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN ${this.noShowCondition()}
            THEN 1
            ELSE 0
          END
        )
        `,
        'noShow',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN ${this.confirmedCondition()}
            THEN 1
            ELSE 0
          END
        )
        `,
        'confirmed',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN ${this.pendingCondition()}
            THEN 1
            ELSE 0
          END
        )
        `,
        'pending',
      )
      .addSelect(
        `
        SUM(
          CASE
            WHEN YEAR(appointment.fecha) = YEAR(CURDATE())
             AND MONTH(appointment.fecha) = MONTH(CURDATE())
            THEN 1
            ELSE 0
          END
        )
        `,
        'appointmentsThisMonth',
      )
      .getRawOne<{
        totalAppointments: string;
        attended: string;
        cancelled: string;
        noShow: string;
        confirmed: string;
        pending: string;
        appointmentsThisMonth: string;
      }>();

    const totalAppointments = Number(
      summaryRaw?.totalAppointments ?? 0,
    );

    const attended = Number(
      summaryRaw?.attended ?? 0,
    );

    const cancelled = Number(
      summaryRaw?.cancelled ?? 0,
    );

    const noShow = Number(
      summaryRaw?.noShow ?? 0,
    );

    const confirmed = Number(
      summaryRaw?.confirmed ?? 0,
    );

    const pending = Number(
      summaryRaw?.pending ?? 0,
    );

    /**
     * La tasa de inasistencia se calcula únicamente sobre
     * las citas cuyo resultado de asistencia ya se conoce:
     *
     * atendidas + inasistencias.
     */
    const completedAttendanceControl =
      attended + noShow;

    const noShowRate =
      completedAttendanceControl > 0
        ? Number(
            (
              (noShow /
                completedAttendanceControl) *
              100
            ).toFixed(2),
          )
        : 0;

    const totalPatientsQuery = this.applyFilters(
      this.createBaseQuery(),
      filters,
    );

    const totalPatientsRaw =
      await totalPatientsQuery
        .select(
          `
          COUNT(
            DISTINCT appointment.patientId
          )
          `,
          'totalPatients',
        )
        .getRawOne<{
          totalPatients: string;
        }>();

    const appointmentsByStatus =
      await this.applyFilters(
        this.createBaseQuery(),
        filters,
      )
        .select(
          'LOWER(TRIM(appointment.estado))',
          'status',
        )
        .addSelect(
          'COUNT(appointment.id)',
          'total',
        )
        .groupBy(
          'LOWER(TRIM(appointment.estado))',
        )
        .orderBy('total', 'DESC')
        .getRawMany<{
          status: string;
          total: string;
        }>();

    const appointmentsBySpecialty =
      await this.applyFilters(
        this.createBaseQuery(),
        filters,
      )
        .select(
          `
          COALESCE(
            specialty.nombre,
            'Sin especialidad'
          )
          `,
          'specialty',
        )
        .addSelect(
          'appointment.specialtyId',
          'specialtyId',
        )
        .addSelect(
          'COUNT(appointment.id)',
          'total',
        )
        .groupBy(
          'appointment.specialtyId',
        )
        .addGroupBy(
          'specialty.nombre',
        )
        .orderBy('total', 'DESC')
        .getRawMany<{
          specialtyId: string | null;
          specialty: string;
          total: string;
        }>();

    const appointmentsByDoctor =
      await this.applyFilters(
        this.createBaseQuery(),
        filters,
      )
        .select(
          `
          COALESCE(
            doctor.nombre,
            'Sin médico asignado'
          )
          `,
          'doctor',
        )
        .addSelect(
          'appointment.doctorId',
          'doctorId',
        )
        .addSelect(
          'COUNT(appointment.id)',
          'total',
        )
        .groupBy(
          'appointment.doctorId',
        )
        .addGroupBy(
          'doctor.nombre',
        )
        .orderBy('total', 'DESC')
        .getRawMany<{
          doctorId: string | null;
          doctor: string;
          total: string;
        }>();

    const appointmentsByMonth =
      await this.applyFilters(
        this.createBaseQuery(),
        filters,
      )
        .select(
          `
          DATE_FORMAT(
            appointment.fecha,
            '%Y-%m'
          )
          `,
          'month',
        )
        .addSelect(
          'COUNT(appointment.id)',
          'total',
        )
        .groupBy(
          `
          DATE_FORMAT(
            appointment.fecha,
            '%Y-%m'
          )
          `,
        )
        .orderBy('month', 'ASC')
        .getRawMany<{
          month: string;
          total: string;
        }>();

    const appointmentsByHour =
      await this.applyFilters(
        this.createBaseQuery(),
        filters,
      )
        .select(
          'LEFT(appointment.hora, 5)',
          'hour',
        )
        .addSelect(
          'COUNT(appointment.id)',
          'total',
        )
        .groupBy(
          'LEFT(appointment.hora, 5)',
        )
        .orderBy('total', 'DESC')
        .limit(10)
        .getRawMany<{
          hour: string;
          total: string;
        }>();

    const noShowsBySpecialty =
      await this.applyFilters(
        this.createBaseQuery(),
        filters,
      )
        .andWhere(
          this.noShowCondition(),
        )
        .select(
          `
          COALESCE(
            specialty.nombre,
            'Sin especialidad'
          )
          `,
          'specialty',
        )
        .addSelect(
          'appointment.specialtyId',
          'specialtyId',
        )
        .addSelect(
          'COUNT(appointment.id)',
          'total',
        )
        .groupBy(
          'appointment.specialtyId',
        )
        .addGroupBy(
          'specialty.nombre',
        )
        .orderBy('total', 'DESC')
        .getRawMany<{
          specialtyId: string | null;
          specialty: string;
          total: string;
        }>();

    return {
      filters,

      summary: {
        totalAppointments,

        totalPatients: Number(
          totalPatientsRaw?.totalPatients ?? 0,
        ),

        attended,
        cancelled,
        noShow,
        confirmed,
        pending,

        appointmentsThisMonth: Number(
          summaryRaw?.appointmentsThisMonth ??
            0,
        ),

        noShowRate,
      },

      charts: {
        appointmentsByStatus:
          appointmentsByStatus.map(
            (item) => ({
              status:
                item.status || 'sin estado',

              total: Number(item.total),
            }),
          ),

        appointmentsBySpecialty:
          appointmentsBySpecialty.map(
            (item) => ({
              specialtyId:
                item.specialtyId
                  ? Number(
                      item.specialtyId,
                    )
                  : null,

              specialty:
                item.specialty,

              total: Number(item.total),
            }),
          ),

        appointmentsByDoctor:
          appointmentsByDoctor.map(
            (item) => ({
              doctorId:
                item.doctorId
                  ? Number(
                      item.doctorId,
                    )
                  : null,

              doctor:
                item.doctor,

              total: Number(item.total),
            }),
          ),

        appointmentsByMonth:
          appointmentsByMonth.map(
            (item) => ({
              month:
                item.month,

              total: Number(item.total),
            }),
          ),

        appointmentsByHour:
          appointmentsByHour.map(
            (item) => ({
              hour:
                item.hour,

              total: Number(item.total),
            }),
          ),

        noShowsBySpecialty:
          noShowsBySpecialty.map(
            (item) => ({
              specialtyId:
                item.specialtyId
                  ? Number(
                      item.specialtyId,
                    )
                  : null,

              specialty:
                item.specialty,

              total: Number(item.total),
            }),
          ),
      },
    };
  }

  /**
   * Devuelve el detalle de las inasistencias para mostrarlo
   * en la tabla y posteriormente exportarlo.
   */
  async getNoShows(
    filters: ReportFiltersDto,
  ) {
    const query = this.applyFilters(
      this.createBaseQuery(),
      filters,
    );

    const results = await query
      .andWhere(
        this.noShowCondition(),
      )
      .select(
        'appointment.id',
        'appointmentId',
      )
      .addSelect(
        'appointment.fecha',
        'date',
      )
      .addSelect(
        'appointment.hora',
        'time',
      )
      .addSelect(
        'appointment.estado',
        'status',
      )
      .addSelect(
        'appointment.prioridad',
        'priority',
      )
      .addSelect(
        'appointment.eps',
        'eps',
      )
      .addSelect(
        'appointment.municipio',
        'municipality',
      )
      .addSelect(
        'patient.id',
        'patientId',
      )
      .addSelect(
        `
        TRIM(
          CONCAT(
            COALESCE(
              patient.primerNombre,
              ''
            ),
            ' ',
            COALESCE(
              patient.segundoNombre,
              ''
            ),
            ' ',
            COALESCE(
              patient.primerApellido,
              ''
            ),
            ' ',
            COALESCE(
              patient.segundoApellido,
              ''
            )
          )
        )
        `,
        'patientName',
      )
      .addSelect(
        'patient.numeroDocumento',
        'documentNumber',
      )
      .addSelect(
        'patient.telefono',
        'phone',
      )
      .addSelect(
        'patient.email',
        'email',
      )
      .addSelect(
        `
        COALESCE(
          doctor.nombre,
          'Sin médico asignado'
        )
        `,
        'doctorName',
      )
      .addSelect(
        `
        COALESCE(
          specialty.nombre,
          'Sin especialidad'
        )
        `,
        'specialtyName',
      )
      .orderBy(
        'appointment.fecha',
        'DESC',
      )
      .addOrderBy(
        'appointment.hora',
        'DESC',
      )
      .getRawMany<{
        appointmentId: string;
        date: string;
        time: string;
        status: string;
        priority: string;
        eps: string | null;
        municipality: string | null;
        patientId: string;
        patientName: string;
        documentNumber: string;
        phone: string;
        email: string;
        doctorName: string;
        specialtyName: string;
      }>();

    return {
      total: results.length,
      filters,

      data: results.map(
        (item) => ({
          appointmentId: Number(
            item.appointmentId,
          ),

          date:
            item.date,

          time:
            item.time,

          status:
            item.status,

          priority:
            item.priority,

          eps:
            item.eps,

          municipality:
            item.municipality,

          patientId: Number(
            item.patientId,
          ),

          patientName:
            item.patientName
              ?.replace(/\s+/g, ' ')
              .trim() || 'Sin nombre',

          documentNumber:
            item.documentNumber,

          phone:
            item.phone,

          email:
            item.email,

          doctorName:
            item.doctorName,

          specialtyName:
            item.specialtyName,
        }),
      ),
    };
  }

  /**
   * Devuelve todas las citas según los filtros aplicados.
   *
   * Este método se utilizará para:
   * - mostrar el reporte general;
   * - exportar a Excel;
   * - exportar a CSV;
   * - exportar a PDF;
   * - imprimir el reporte.
   */
  async getAppointments(
    filters: ReportFiltersDto,
  ) {
    const query = this.applyFilters(
      this.createBaseQuery(),
      filters,
    );

    const results = await query
      .select(
        'appointment.id',
        'appointmentId',
      )
      .addSelect(
        'appointment.fecha',
        'date',
      )
      .addSelect(
        'appointment.hora',
        'time',
      )
      .addSelect(
        'appointment.estado',
        'status',
      )
      .addSelect(
        'appointment.prioridad',
        'priority',
      )
      .addSelect(
        'appointment.motivoConsulta',
        'reason',
      )
      .addSelect(
        'appointment.observaciones',
        'observations',
      )
      .addSelect(
        'appointment.eps',
        'eps',
      )
      .addSelect(
        'appointment.municipio',
        'municipality',
      )
      .addSelect(
        'appointment.departamento',
        'department',
      )

      .addSelect(
        'patient.id',
        'patientId',
      )
      .addSelect(
        `
        TRIM(
          CONCAT(
            COALESCE(
              patient.primerNombre,
              ''
            ),
            ' ',
            COALESCE(
              patient.segundoNombre,
              ''
            ),
            ' ',
            COALESCE(
              patient.primerApellido,
              ''
            ),
            ' ',
            COALESCE(
              patient.segundoApellido,
              ''
            )
          )
        )
        `,
        'patientName',
      )
      .addSelect(
        'patient.tipoDocumento',
        'documentType',
      )
      .addSelect(
        'patient.numeroDocumento',
        'documentNumber',
      )
      .addSelect(
        'patient.telefono',
        'phone',
      )
      .addSelect(
        'patient.email',
        'email',
      )

      .addSelect(
        'doctor.id',
        'doctorId',
      )
      .addSelect(
        `
        COALESCE(
          doctor.nombre,
          'Sin médico asignado'
        )
        `,
        'doctorName',
      )

      .addSelect(
        'specialty.id',
        'specialtyId',
      )
      .addSelect(
        `
        COALESCE(
          specialty.nombre,
          'Sin especialidad'
        )
        `,
        'specialtyName',
      )

      .orderBy(
        'appointment.fecha',
        'DESC',
      )
      .addOrderBy(
        'appointment.hora',
        'DESC',
      )
      .getRawMany<{
        appointmentId: string;
        date: string;
        time: string;
        status: string;
        priority: string;
        reason: string | null;
        observations: string | null;
        eps: string | null;
        municipality: string | null;
        department: string | null;

        patientId: string;
        patientName: string;
        documentType: string;
        documentNumber: string;
        phone: string;
        email: string;

        doctorId: string | null;
        doctorName: string;

        specialtyId: string | null;
        specialtyName: string;
      }>();

    return {
      total: results.length,
      filters,

      data: results.map(
        (item) => ({
          appointmentId: Number(
            item.appointmentId,
          ),

          date:
            item.date,

          time:
            item.time,

          status:
            item.status,

          priority:
            item.priority,

          reason:
            item.reason,

          observations:
            item.observations,

          eps:
            item.eps,

          municipality:
            item.municipality,

          department:
            item.department,

          patientId: Number(
            item.patientId,
          ),

          patientName:
            item.patientName
              ?.replace(/\s+/g, ' ')
              .trim() || 'Sin nombre',

          documentType:
            item.documentType,

          documentNumber:
            item.documentNumber,

          phone:
            item.phone,

          email:
            item.email,

          doctorId:
            item.doctorId
              ? Number(item.doctorId)
              : null,

          doctorName:
            item.doctorName,

          specialtyId:
            item.specialtyId
              ? Number(
                  item.specialtyId,
                )
              : null,

          specialtyName:
            item.specialtyName,
        }),
      ),
    };
  }
}