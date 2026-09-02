import { ServiceUnavailableException } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { InalambriaProvider } from './inalambria.provider';

describe('InalambriaProvider', () => {
  const apiKey = 'test-secret-that-must-not-leak';
  const phone = '+573001234567';
  const post = jest.fn();

  const createProvider = () =>
    new InalambriaProvider(
      {
        apiKey,
        baseUrl: 'https://api.inalambria.express/v1',
        timeoutMs: 5000,
      },
      { post } as unknown as AxiosInstance,
    );

  beforeEach(() => post.mockReset());

  it('envia el contrato sincronico oficial y traduce consumptionId', async () => {
    post.mockResolvedValue({
      status: 200,
      data: {
        ok: true,
        consumptionId: 'consumption-1',
        credits: 1,
        messages: 1,
      },
    });

    await expect(
      createProvider().send(phone, 'Codigo SICSA: 123456'),
    ).resolves.toEqual({
      providerMessageId: 'consumption-1',
    });
    expect(post).toHaveBeenCalledWith('/messages/send', {
      content: 'Codigo SICSA: 123456',
      recipients: [phone],
      async: false,
    });
  });

  it.each([400, 401, 403, 429, 500])(
    'oculta la respuesta del proveedor ante HTTP %s',
    async (status) => {
      post.mockRejectedValue({
        isAxiosError: true,
        response: { status, data: { error: `provider-${status}` } },
      });

      const promise = createProvider().send(phone, 'mensaje');
      await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(promise).rejects.not.toThrow(`provider-${status}`);
    },
  );

  it('traduce timeout y fallo de red sin filtrar datos sensibles', async () => {
    post.mockRejectedValue({ isAxiosError: true, code: 'ECONNABORTED' });

    let thrown: unknown;
    try {
      await createProvider().send(phone, 'mensaje');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ServiceUnavailableException);
    const message = (thrown as Error).message;
    expect(message).not.toContain(apiKey);
    expect(message).not.toContain(phone);
  });

  it('rechaza una respuesta 2xx con forma invalida', async () => {
    post.mockResolvedValue({ status: 200, data: { ok: true } });

    await expect(createProvider().send(phone, 'mensaje')).rejects.toThrow(
      'respuesta invalida',
    );
  });

  it('rechaza configuracion incompleta sin revelar el secreto', () => {
    expect(
      () =>
        new InalambriaProvider({
          apiKey: '',
          baseUrl: 'https://api.inalambria.express/v1',
          timeoutMs: 5000,
        }),
    ).toThrow('configuracion del proveedor SMS Inalambria esta incompleta');
  });
});
