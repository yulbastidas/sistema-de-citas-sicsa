import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentClassService } from './appointment-class.service';

describe('AppointmentClassService', () => {
  let service: AppointmentClassService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentClassService],
    }).compile();

    service = module.get<AppointmentClassService>(AppointmentClassService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
