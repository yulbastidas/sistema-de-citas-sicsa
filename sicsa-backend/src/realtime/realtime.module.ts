import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { SignOptions } from 'jsonwebtoken';
import { getJwtExpiresIn, getJwtSecret } from '../config/environment';
import { Doctor } from '../doctors/entities/doctor.entity';
import { User } from '../users/entities/user.entity';
import { SocketAuthService } from './socket-auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Doctor]),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'] },
    }),
  ],
  providers: [SocketAuthService],
  exports: [SocketAuthService],
})
export class RealtimeModule {}
