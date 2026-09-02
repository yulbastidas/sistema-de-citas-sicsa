import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  maskPhone,
  normalizeColombianPhone,
} from '../../patients/security/colombian-phone';
import { SMS_PROVIDER, SmsDelivery, SmsProvider } from './sms-provider';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(@Inject(SMS_PROVIDER) private readonly provider: SmsProvider) {}

  async send(destination: string, message: string): Promise<SmsDelivery> {
    const normalized = normalizeColombianPhone(destination);
    const result = await this.provider.send(normalized, message);
    this.logger.log(`SMS aceptado para ${maskPhone(normalized)}`);
    return result;
  }
}
