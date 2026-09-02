import { ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SmsDelivery, SmsProvider } from './sms-provider';

type N8nSmsSuccessResponse = {
  ok: true;
  providerMessageId?: string;
};

export type N8nSmsProviderOptions = {
  webhookUrl: string;
  internalToken: string;
  timeoutMs: number;
};

export class N8nSmsProvider implements SmsProvider {
  private readonly http: AxiosInstance;

  constructor(options: N8nSmsProviderOptions, http?: AxiosInstance) {
    const webhookUrl = options.webhookUrl.trim();
    const internalToken = options.internalToken.trim();

    if (
      !webhookUrl ||
      !internalToken ||
      !Number.isInteger(options.timeoutMs) ||
      options.timeoutMs <= 0
    ) {
      throw new Error('La configuracion del proveedor SMS n8n esta incompleta');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(webhookUrl);
    } catch {
      throw new Error('N8N_SMS_WEBHOOK_URL no es una URL valida');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('N8N_SMS_WEBHOOK_URL debe usar HTTP o HTTPS');
    }

    this.http =
      http ??
      axios.create({
        timeout: options.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'x-sicsa-internal-token': internalToken,
        },
      });
    this.webhookUrl = parsedUrl.toString();
  }

  private readonly webhookUrl: string;

  async send(destinationE164: string, message: string): Promise<SmsDelivery> {
    try {
      const response = await this.http.post<unknown>(this.webhookUrl, {
        phone: destinationE164,
        message,
      });

      if (!this.isSuccessResponse(response.data)) {
        throw new ServiceUnavailableException(
          'El servicio de mensajes devolvio una respuesta invalida',
        );
      }

      return { providerMessageId: response.data.providerMessageId };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;

      throw new ServiceUnavailableException(
        'No fue posible enviar el mensaje en este momento',
      );
    }
  }

  private isSuccessResponse(value: unknown): value is N8nSmsSuccessResponse {
    if (!value || typeof value !== 'object') return false;

    const response = value as Record<string, unknown>;
    return (
      response.ok === true &&
      (response.providerMessageId === undefined ||
        (typeof response.providerMessageId === 'string' &&
          response.providerMessageId.length > 0))
    );
  }
}
