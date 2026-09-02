import { ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { N8nSmsProvider } from './n8n-sms.provider';
import { SmsProvider } from './sms-provider';

describe('N8nSmsProvider', () => {
  const webhookUrl = 'https://n8n.test/webhook/sicsa-sms';
  const internalToken = 'internal-secret-that-must-not-leak';
  const phone = '+573001234567';
  const post = jest.fn();

  const createProvider = (): N8nSmsProvider =>
    new N8nSmsProvider({ webhookUrl, internalToken, timeoutMs: 5000 }, {
      post,
    } as unknown as AxiosInstance);

  beforeEach(() => jest.restoreAllMocks());

  it('implementa SmsProvider y envia solamente telefono y mensaje', async () => {
    post.mockResolvedValue({
      data: { ok: true, providerMessageId: 'provider-1' },
    });
    const provider: SmsProvider = createProvider();

    await expect(provider.send(phone, 'Codigo SICSA: 123456')).resolves.toEqual(
      {
        providerMessageId: 'provider-1',
      },
    );
    expect(post).toHaveBeenCalledWith(webhookUrl, {
      phone,
      message: 'Codigo SICSA: 123456',
    });
  });

  it('configura el header interno y timeout sin incluirlos en el payload', () => {
    const create = jest.spyOn(axios, 'create').mockReturnValue({
      post,
    } as unknown as AxiosInstance);

    new N8nSmsProvider({ webhookUrl, internalToken, timeoutMs: 4321 });

    expect(create).toHaveBeenCalledWith({
      timeout: 4321,
      headers: {
        'Content-Type': 'application/json',
        'x-sicsa-internal-token': internalToken,
      },
    });
  });

  it.each([
    ['timeout', { code: 'ECONNABORTED' }],
    ['n8n caido', { code: 'ECONNREFUSED' }],
    ['401', { response: { status: 401 } }],
    ['403', { response: { status: 403 } }],
    ['429', { response: { status: 429 } }],
    ['500', { response: { status: 500 } }],
  ])('traduce %s a un error seguro', async (_case, providerError) => {
    post.mockRejectedValue(providerError);

    let thrown: unknown;
    try {
      await createProvider().send(phone, 'mensaje');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ServiceUnavailableException);
    const message = (thrown as Error).message;
    expect(message).toBe('No fue posible enviar el mensaje en este momento');
    expect(message).not.toContain(internalToken);
    expect(message).not.toContain(phone);
  });

  it('rechaza una respuesta invalida', async () => {
    post.mockResolvedValue({ data: { ok: false, providerResponse: 'secret' } });

    await expect(createProvider().send(phone, 'mensaje')).rejects.toThrow(
      'respuesta invalida',
    );
  });

  it('acepta una respuesta correcta sin identificador opcional', async () => {
    post.mockResolvedValue({ data: { ok: true } });

    await expect(createProvider().send(phone, 'mensaje')).resolves.toEqual({
      providerMessageId: undefined,
    });
  });

  it('rechaza configuracion incompleta sin revelar secretos', () => {
    expect(
      () =>
        new N8nSmsProvider({
          webhookUrl,
          internalToken: '',
          timeoutMs: 5000,
        }),
    ).toThrow('configuracion del proveedor SMS n8n esta incompleta');
  });
});
