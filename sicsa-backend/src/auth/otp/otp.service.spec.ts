import { BadRequestException } from '@nestjs/common';
import { FakeSmsProvider } from '../../communications/sms/fake-sms.provider';
import { SmsService } from '../../communications/sms/sms.service';
import { OtpChallenge } from './otp-challenge.entity';
import { OtpChallengeStore, OtpRateQuery } from './otp-challenge.store';
import { OtpPurpose } from './otp-purpose';
import { OtpService } from './otp.service';

/* eslint-disable @typescript-eslint/require-await -- almacén asíncrono en memoria para pruebas */

class InMemoryOtpStore implements OtpChallengeStore {
  challenges: OtpChallenge[] = [];

  private count(query: OtpRateQuery, field: 'userId' | 'phoneHash' | 'ipHash') {
    return this.challenges.filter(
      (item) =>
        item[field] === query[field] &&
        item.purpose === query.purpose &&
        item.createdAt >= query.since,
    ).length;
  }

  async countByUser(query: OtpRateQuery) {
    return this.count(query, 'userId');
  }
  async countByPhone(query: OtpRateQuery) {
    return this.count(query, 'phoneHash');
  }
  async countByIp(query: OtpRateQuery) {
    return this.count(query, 'ipHash');
  }

  async findLatest(query: Omit<OtpRateQuery, 'since'>) {
    return (
      this.challenges
        .filter(
          (item) =>
            item.userId === query.userId &&
            item.phoneHash === query.phoneHash &&
            item.purpose === query.purpose,
        )
        .sort(
          (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
        )[0] ?? null
    );
  }

  async createReplacingActive(challenge: OtpChallenge) {
    this.challenges.forEach((item) => {
      if (item.activeKey === challenge.activeKey) {
        item.activeKey = null;
        item.invalidatedAt = new Date();
      }
    });
    challenge.id = `challenge-${this.challenges.length + 1}`;
    this.challenges.push(challenge);
    return challenge;
  }

  async invalidate(id: string, at: Date) {
    const challenge = this.challenges.find((item) => item.id === id);
    if (challenge) {
      challenge.invalidatedAt = at;
      challenge.activeKey = null;
    }
  }

  async findForVerification(id: string, userId: number) {
    return (
      this.challenges.find(
        (item) => item.id === id && item.userId === userId,
      ) ?? null
    );
  }

  async recordFailure(id: string, maxAttempts: number, at: Date) {
    const challenge = this.challenges.find((item) => item.id === id);
    if (!challenge) return;
    challenge.attempts += 1;
    if (challenge.attempts >= maxAttempts) {
      challenge.invalidatedAt = at;
      challenge.activeKey = null;
    }
  }

  async consumeIfActive(id: string, at: Date) {
    const challenge = this.challenges.find((item) => item.id === id);
    if (!challenge || challenge.consumedAt || challenge.invalidatedAt)
      return false;
    challenge.consumedAt = at;
    challenge.activeKey = null;
    return true;
  }
}

describe('OtpService', () => {
  const previousSecret = process.env.OTP_HMAC_SECRET;
  let store: InMemoryOtpStore;
  let provider: FakeSmsProvider;
  let service: OtpService;

  beforeEach(() => {
    process.env.OTP_HMAC_SECRET = 'test-only-independent-secret-with-32-bytes';
    store = new InMemoryOtpStore();
    provider = new FakeSmsProvider();
    service = new OtpService(store, new SmsService(provider));
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.OTP_HMAC_SECRET;
    else process.env.OTP_HMAC_SECRET = previousSecret;
  });

  it('crea un OTP de seis dígitos, guarda solo el hash y enmascara el teléfono', async () => {
    const result = await service.request({
      userId: 7,
      phone: '3001234567',
      requestIp: '127.0.0.1',
      purpose: OtpPurpose.PHONE_VERIFICATION,
    });

    expect(result.maskedPhone).toBe('******4567');
    expect(provider.deliveries[0].destinationE164).toBe('+573001234567');
    expect(provider.deliveries[0].message).toMatch(/\b\d{6}\b/);
    expect(store.challenges[0].codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(store.challenges[0].codeHash).not.toContain(
      provider.deliveries[0].message.match(/\d{6}/)?.[0] ?? '',
    );
  });

  it('acepta el código una sola vez y rechaza replay', async () => {
    const created = await service.request({
      userId: 7,
      phone: '3001234567',
      requestIp: '127.0.0.1',
      purpose: OtpPurpose.PHONE_VERIFICATION,
    });
    const code = provider.deliveries[0].message.match(/\d{6}/)?.[0] ?? '';

    await expect(
      service.verify({
        challengeId: created.challengeId,
        userId: 7,
        code,
        purpose: OtpPurpose.PHONE_VERIFICATION,
      }),
    ).resolves.toBe(true);
    await expect(
      service.verify({
        challengeId: created.challengeId,
        userId: 7,
        code,
        purpose: OtpPurpose.PHONE_VERIFICATION,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('invalida el challenge después de cinco intentos fallidos', async () => {
    const created = await service.request({
      userId: 7,
      phone: '3001234567',
      requestIp: '127.0.0.1',
      purpose: OtpPurpose.PHONE_VERIFICATION,
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        service.verify({
          challengeId: created.challengeId,
          userId: 7,
          code: '000000',
          purpose: OtpPurpose.PHONE_VERIFICATION,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    expect(store.challenges[0].invalidatedAt).toBeInstanceOf(Date);
  });

  it('aplica cooldown de reenvío y límite horario', async () => {
    const input = {
      userId: 7,
      phone: '3001234567',
      requestIp: '127.0.0.1',
      purpose: OtpPurpose.PHONE_VERIFICATION,
    };
    await service.request(input);
    await expect(service.request(input)).rejects.toMatchObject({ status: 429 });

    store.challenges[0].resendAvailableAt = new Date(0);
    for (let index = 1; index < 5; index += 1) {
      await service.request(input);
      store.challenges[index].resendAvailableAt = new Date(0);
    }
    await expect(service.request(input)).rejects.toMatchObject({ status: 429 });
  });

  it('invalida el challenge si el proveedor SMS falla', async () => {
    const failingProvider = {
      send: jest.fn().mockRejectedValue(new Error('provider unavailable')),
    };
    const failingService = new OtpService(
      store,
      new SmsService(failingProvider),
    );

    await expect(
      failingService.request({
        userId: 7,
        phone: '3001234567',
        requestIp: '127.0.0.1',
        purpose: OtpPurpose.PHONE_VERIFICATION,
      }),
    ).rejects.toThrow('provider unavailable');
    expect(store.challenges[0].invalidatedAt).toBeInstanceOf(Date);
  });
});
