import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Eps } from './entities/eps.entity';
import { EpsController } from './eps.controller';
import { EpsService } from './eps.service';

@Module({
  imports: [TypeOrmModule.forFeature([Eps])],
  controllers: [EpsController],
  providers: [EpsService],
  exports: [EpsService],
})
export class EpsModule {}
