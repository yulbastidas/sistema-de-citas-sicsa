import { ServiceUnavailableException } from '@nestjs/common';
import { SmsDelivery, SmsProvider } from './sms-provider';

export class UnavailableSmsProvider implements SmsProvider {
  send(): Promise<SmsDelivery> {
    throw new ServiceUnavailableException(
      'El servicio de mensajes no está configurado',
    );
  }
}
