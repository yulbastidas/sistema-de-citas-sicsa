import { SmsService } from './sms.service';
import { FakeSmsProvider } from './fake-sms.provider';

describe('SmsService', () => {
  it('normaliza el destino y delega sin acoplarse al proveedor', async () => {
    const provider = new FakeSmsProvider();
    const service = new SmsService(provider);

    await service.send('3001234567', 'Mensaje de prueba');

    expect(provider.deliveries).toEqual([
      { destinationE164: '+573001234567', message: 'Mensaje de prueba' },
    ]);
  });
});
