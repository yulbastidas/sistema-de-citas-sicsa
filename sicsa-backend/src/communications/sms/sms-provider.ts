export type SmsDelivery = { providerMessageId?: string };

export interface SmsProvider {
  send(destinationE164: string, message: string): Promise<SmsDelivery>;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
