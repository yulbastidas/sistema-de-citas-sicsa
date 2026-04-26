import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentClassController } from './appointment-class.controller';

describe('AppointmentClassController', () => {
  let controller: AppointmentClassController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentClassController],
    }).compile();

    controller = module.get<AppointmentClassController>(
      AppointmentClassController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
