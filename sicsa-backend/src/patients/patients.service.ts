import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Like,
  Not,
  Repository,
} from 'typeorm';

import { Patient } from './entities/patient.entity';
import { User } from '../users/entities/user.entity';

type UpdateMyProfileData = {
  telefono?: string;
  email?: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  tipoSangre?: string;
  factorRh?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
};

type UpdatePatientByAdminData = {
  tipoDocumento?: string;
  numeroDocumento?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  telefono?: string;
  email?: string;
  eps?: string;
  epsId?: number;
  genero?: string;
  fechaNacimiento?: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  tipoSangre?: string;
  factorRh?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
};

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  private normalizeEmail(emailRaw: string): string {
    if (!emailRaw || typeof emailRaw !== 'string') {
      throw new BadRequestException('Correo inválido');
    }

    const email = emailRaw.trim().toLowerCase();

    if (!email || email.length > 150) {
      throw new BadRequestException('Correo inválido');
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      throw new BadRequestException(
        'El formato del correo no es válido',
      );
    }

    return email;
  }

  private normalizeOptionalText(
    value: string | undefined,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value.trim();
  }

  private async validateEmailAvailability(
    email: string,
    userId: number,
  ): Promise<void> {
    const existingUser =
      await this.userRepository.findOne({
        where: {
          email,
          id: Not(userId),
        },
      });

    if (existingUser) {
      throw new BadRequestException(
        'El correo ya está registrado por otro usuario',
      );
    }
  }

  create(data: Partial<Patient>) {
    const patient =
      this.patientRepository.create(data);

    return this.patientRepository.save(patient);
  }

  findAll(search?: string) {
    if (!search?.trim()) {
      return this.patientRepository.find({
        order: {
          id: 'DESC',
        },
      });
    }

    const searchValue = search.trim();

    return this.patientRepository.find({
      where: [
        {
          numeroDocumento: Like(
            `%${searchValue}%`,
          ),
        },
        {
          email: Like(`%${searchValue}%`),
        },
        {
          primerNombre: Like(
            `%${searchValue}%`,
          ),
        },
        {
          segundoNombre: Like(
            `%${searchValue}%`,
          ),
        },
        {
          primerApellido: Like(
            `%${searchValue}%`,
          ),
        },
        {
          segundoApellido: Like(
            `%${searchValue}%`,
          ),
        },
        {
          telefono: Like(`%${searchValue}%`),
        },
        {
          eps: Like(`%${searchValue}%`),
        },
        {
          genero: Like(`%${searchValue}%`),
        },
        {
          fechaNacimiento: Like(
            `%${searchValue}%`,
          ),
        },
        {
          departamento: Like(
            `%${searchValue}%`,
          ),
        },
        {
          municipio: Like(
            `%${searchValue}%`,
          ),
        },
        {
          direccion: Like(`%${searchValue}%`),
        },
        {
          tipoSangre: Like(
            `%${searchValue}%`,
          ),
        },
        {
          factorRh: Like(`%${searchValue}%`),
        },
        {
          alergias: Like(`%${searchValue}%`),
        },
        {
          enfermedadesCronicas: Like(
            `%${searchValue}%`,
          ),
        },
        {
          contactoEmergenciaNombre: Like(
            `%${searchValue}%`,
          ),
        },
        {
          contactoEmergenciaTelefono: Like(
            `%${searchValue}%`,
          ),
        },
        {
          contactoEmergenciaParentesco: Like(
            `%${searchValue}%`,
          ),
        },
      ],
      order: {
        id: 'DESC',
      },
    });
  }

  async findByUserId(
    userId: number,
  ): Promise<Patient> {
    const patient =
      await this.patientRepository.findOne({
        where: {
          userId,
        },
      });

    if (!patient) {
      throw new NotFoundException(
        'Paciente no encontrado',
      );
    }

    return patient;
  }

  async findById(id: number): Promise<Patient> {
    const patient =
      await this.patientRepository.findOne({
        where: {
          id,
        },
      });

    if (!patient) {
      throw new NotFoundException(
        'Paciente no encontrado',
      );
    }

    return patient;
  }

  async updateMyProfile(
    userId: number,
    data: UpdateMyProfileData,
  ) {
    const patient =
      await this.findByUserId(userId);

    let normalizedEmail: string | undefined;

    if (data.email !== undefined) {
      normalizedEmail =
        this.normalizeEmail(data.email);

      await this.validateEmailAvailability(
        normalizedEmail,
        patient.userId,
      );
    }

    const updatedPatient =
      await this.dataSource.transaction(
        async (manager) => {
          const patientRepository =
            manager.getRepository(Patient);

          const userRepository =
            manager.getRepository(User);

          if (data.telefono !== undefined) {
            patient.telefono =
              data.telefono.trim();
          }

          if (normalizedEmail !== undefined) {
            patient.email = normalizedEmail;

            const user =
              await userRepository.findOne({
                where: {
                  id: patient.userId,
                },
              });

            if (!user) {
              throw new NotFoundException(
                'Usuario relacionado no encontrado',
              );
            }

            user.email = normalizedEmail;

            await userRepository.save(user);
          }

          if (data.departamento !== undefined) {
            patient.departamento =
              data.departamento.trim();
          }

          if (data.municipio !== undefined) {
            patient.municipio =
              data.municipio.trim();
          }

          if (data.direccion !== undefined) {
            patient.direccion =
              data.direccion.trim();
          }

          if (data.tipoSangre !== undefined) {
            patient.tipoSangre =
              data.tipoSangre.trim();
          }

          if (data.factorRh !== undefined) {
            patient.factorRh =
              data.factorRh.trim();
          }

          if (data.alergias !== undefined) {
            patient.alergias =
              data.alergias.trim();
          }

          if (
            data.enfermedadesCronicas !==
            undefined
          ) {
            patient.enfermedadesCronicas =
              data.enfermedadesCronicas.trim();
          }

          if (
            data.contactoEmergenciaNombre !==
            undefined
          ) {
            patient.contactoEmergenciaNombre =
              data.contactoEmergenciaNombre.trim();
          }

          if (
            data.contactoEmergenciaTelefono !==
            undefined
          ) {
            patient.contactoEmergenciaTelefono =
              data.contactoEmergenciaTelefono.trim();
          }

          if (
            data.contactoEmergenciaParentesco !==
            undefined
          ) {
            patient.contactoEmergenciaParentesco =
              data.contactoEmergenciaParentesco.trim();
          }

          return patientRepository.save(patient);
        },
      );

    return {
      message:
        'Perfil actualizado correctamente',
      patient: updatedPatient,
    };
  }

  async updateById(
    id: number,
    data: UpdatePatientByAdminData,
  ) {
    const patient = await this.findById(id);

    let normalizedEmail: string | undefined;

    if (data.email !== undefined) {
      normalizedEmail =
        this.normalizeEmail(data.email);

      await this.validateEmailAvailability(
        normalizedEmail,
        patient.userId,
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        const patientRepository =
          manager.getRepository(Patient);

        const userRepository =
          manager.getRepository(User);

        if (data.tipoDocumento !== undefined) {
          patient.tipoDocumento =
            data.tipoDocumento.trim();
        }

        if (data.numeroDocumento !== undefined) {
          patient.numeroDocumento =
            data.numeroDocumento.trim();
        }

        if (data.primerNombre !== undefined) {
          patient.primerNombre =
            data.primerNombre.trim();
        }

        if (data.segundoNombre !== undefined) {
          patient.segundoNombre =
            data.segundoNombre.trim();
        }

        if (data.primerApellido !== undefined) {
          patient.primerApellido =
            data.primerApellido.trim();
        }

        if (data.segundoApellido !== undefined) {
          patient.segundoApellido =
            data.segundoApellido.trim();
        }

        if (data.telefono !== undefined) {
          patient.telefono =
            data.telefono.trim();
        }

        if (normalizedEmail !== undefined) {
          patient.email = normalizedEmail;

          const user =
            await userRepository.findOne({
              where: {
                id: patient.userId,
              },
            });

          if (!user) {
            throw new NotFoundException(
              'Usuario relacionado no encontrado',
            );
          }

          user.email = normalizedEmail;

          await userRepository.save(user);
        }

        if (data.eps !== undefined) {
          patient.eps = data.eps.trim();
        }

        if (data.epsId !== undefined) {
          patient.epsId = data.epsId;
        }

        if (data.genero !== undefined) {
          patient.genero =
            data.genero.trim();
        }

        if (data.fechaNacimiento !== undefined) {
          patient.fechaNacimiento =
            data.fechaNacimiento.trim();
        }

        if (data.departamento !== undefined) {
          patient.departamento =
            data.departamento.trim();
        }

        if (data.municipio !== undefined) {
          patient.municipio =
            data.municipio.trim();
        }

        if (data.direccion !== undefined) {
          patient.direccion =
            data.direccion.trim();
        }

        if (data.tipoSangre !== undefined) {
          patient.tipoSangre =
            data.tipoSangre.trim();
        }

        if (data.factorRh !== undefined) {
          patient.factorRh =
            data.factorRh.trim();
        }

        if (data.alergias !== undefined) {
          patient.alergias =
            data.alergias.trim();
        }

        if (
          data.enfermedadesCronicas !==
          undefined
        ) {
          patient.enfermedadesCronicas =
            data.enfermedadesCronicas.trim();
        }

        if (
          data.contactoEmergenciaNombre !==
          undefined
        ) {
          patient.contactoEmergenciaNombre =
            data.contactoEmergenciaNombre.trim();
        }

        if (
          data.contactoEmergenciaTelefono !==
          undefined
        ) {
          patient.contactoEmergenciaTelefono =
            data.contactoEmergenciaTelefono.trim();
        }

        if (
          data.contactoEmergenciaParentesco !==
          undefined
        ) {
          patient.contactoEmergenciaParentesco =
            data.contactoEmergenciaParentesco.trim();
        }

        return patientRepository.save(patient);
      },
    );
  }
}