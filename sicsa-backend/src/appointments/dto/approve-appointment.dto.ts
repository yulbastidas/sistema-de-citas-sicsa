import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class ApproveAppointmentDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id!: number;
}
