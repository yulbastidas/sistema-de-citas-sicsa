import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CancelAppointmentDto {
  @Type(() => Number)
  @IsInt()
  id!: number;
}
