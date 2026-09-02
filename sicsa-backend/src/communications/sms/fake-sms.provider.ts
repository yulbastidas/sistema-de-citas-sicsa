import { SmsDelivery, SmsProvider } from './sms-provider';

/* eslint-disable @typescript-eslint/require-await -- conserva el contrato asíncrono del proveedor */

export class FakeSmsProvider implements SmsProvider {
  readonly deliveries: Array<{ destinationE164: string; message: string }> = [];

  async send(destinationE164: string, message: string): Promise<SmsDelivery> {
    this.deliveries.push({ destinationE164, message });
    return { providerMessageId: `fake-${this.deliveries.length}` };
  }
}
