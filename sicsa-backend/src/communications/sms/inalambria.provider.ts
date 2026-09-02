import { ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SmsDelivery, SmsProvider } from './sms-provider';

type InalambriaSuccessResponse = {
  ok: true;
  consumptionId: string;
  credits: number;
  messages: number;
};

export type InalambriaProviderOptions = {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
};

export class InalambriaProvider implements SmsProvider {
  private readonly http: AxiosInstance;

  constructor(options: InalambriaProviderOptions, http?: AxiosInstance) {
    const apiKey = options.apiKey.trim();
    const baseUrl = options.baseUrl.trim().replace(/\/$/, '');

    if (
      !apiKey ||
      !baseUrl ||
      !Number.isInteger(options.timeoutMs) ||
      options.timeoutMs <= 0
    ) {
      throw new Error(
        'La configuracion del proveedor SMS Inalambria esta incompleta',
      );
    }

    this.http =
      http ??
      axios.create({
        baseURL: baseUrl,
        timeout: options.timeoutMs,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
  }

  async send(destinationE164: string, message: string): Promise<SmsDelivery> {
    try {
      const response = await this.http.post<unknown>('/messages/send', {
        content: message,
        recipients: [destinationE164],
        async: false,
      });

      if (!this.isSuccessResponse(response.data)) {
        throw new ServiceUnavailableException(
          'El proveedor de mensajes devolvio una respuesta invalida',
        );
      }

      return { providerMessageId: response.data.consumptionId };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'No fue posible enviar el mensaje en este momento',
      );
    }
  }

  private isSuccessResponse(
    value: unknown,
  ): value is InalambriaSuccessResponse {
    if (!value || typeof value !== 'object') return false;

    const response = value as Record<string, unknown>;
    return (
      response.ok === true &&
      typeof response.consumptionId === 'string' &&
      response.consumptionId.length > 0 &&
      typeof response.credits === 'number' &&
      typeof response.messages === 'number'
    );
  }
}
