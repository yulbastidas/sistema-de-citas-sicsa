import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { VerificationsModule } from './verifications/verifications.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1230809075',
      database: 'sicsa',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    PatientsModule,
    VerificationsModule,
    AppointmentsModule,
    AuthModule,
  ],
})
export class AppModule {}
