import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { SmsService } from '../../communications/sms/sms.service';
import { getOtpConfig, OtpConfig } from '../../config/environment';
import {
  maskPhone,
  normalizeColombianPhone,
} from '../../patients/security/colombian-phone';
import { OtpChallenge } from './otp-challenge.entity';
import { OTP_CHALLENGE_STORE, OtpChallengeStore } from './otp-challenge.store';
import { OtpPurpose } from './otp-purpose';
import { EntityManager } from 'typeorm';

type RequestOtpInput = {
  userId: number;
  phone: string;
  requestIp: string;
  purpose: OtpPurpose;
};

type VerifyOtpInput = {
  challengeId: string;
  userId: number;
  code: string;
  purpose: OtpPurpose;
};

@Injectable()
export class OtpService {
  constructor(
    @Inject(OTP_CHALLENGE_STORE) private readonly store: OtpChallengeStore,
    private readonly smsService: SmsService,
  ) {}

  private get config(): OtpConfig {
    return getOtpConfig();
  }

  private hmac(value: string): string {
    return createHmac('sha256', this.config.hmacSecret)
      .update(value)
      .digest('hex');
  }

  private assertCodeFormat(code: string): void {
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Código inválido o vencido');
    }
  }

  private tooManyRequests(message: string): HttpException {
    return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  }

  async request(
    input: RequestOtpInput,
  ): Promise<{ challengeId: string; maskedPhone: string; expiresAt: Date }> {
    if (!Number.isInteger(input.userId) || input.userId <= 0) {
      throw new BadRequestException('Solicitud OTP inválida');
    }

    const now = new Date();
    const phoneE164 = normalizeColombianPhone(input.phone);
    const phoneHash = this.hmac(`phone:${phoneE164}`);
    const ipHash = this.hmac(`ip:${input.requestIp.trim() || 'unknown'}`);
    const baseQuery = {
      userId: input.userId,
      phoneHash,
      ipHash,
      purpose: input.purpose,
    };
    const hourSince = new Date(now.getTime() - 60 * 60 * 1000);
    const daySince = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [
      latest,
      hourlyByUser,
      hourlyByPhone,
      hourlyByIp,
      dailyByUser,
      dailyByPhone,
    ] = await Promise.all([
      this.store.findLatest(baseQuery),
      this.store.countByUser({ ...baseQuery, since: hourSince }),
      this.store.countByPhone({ ...baseQuery, since: hourSince }),
      this.store.countByIp({ ...baseQuery, since: hourSince }),
      this.store.countByUser({ ...baseQuery, since: daySince }),
      this.store.countByPhone({ ...baseQuery, since: daySince }),
    ]);

    if (latest?.resendAvailableAt && latest.resendAvailableAt > now) {
      throw this.tooManyRequests('Espera antes de solicitar otro código');
    }
    if (
      Math.max(hourlyByUser, hourlyByPhone, hourlyByIp) >=
        this.config.hourlySendLimit ||
      Math.max(dailyByUser, dailyByPhone) >= this.config.dailySendLimit
    ) {
      throw this.tooManyRequests('Límite temporal de códigos alcanzado');
    }

    const code = randomInt(100000, 1000000).toString();
    const challenge = new OtpChallenge();
    challenge.userId = input.userId;
    challenge.purpose = input.purpose;
    challenge.phoneHash = phoneHash;
    challenge.phoneE164 = phoneE164;
    challenge.ipHash = ipHash;
    challenge.activeKey = this.hmac(
      `active:${input.userId}:${phoneHash}:${input.purpose}`,
    );
    challenge.codeHash = this.hmac(`code:${code}`);
    challenge.expiresAt = new Date(now.getTime() + this.config.expiresMs);
    challenge.resendAvailableAt = new Date(
      now.getTime() + this.config.resendCooldownMs,
    );
    challenge.attempts = 0;
    challenge.consumedAt = null;
    challenge.invalidatedAt = null;
    challenge.createdAt = now;

    const saved = await this.store.createReplacingActive(challenge);
    try {
      const validityMinutes = Math.ceil(this.config.expiresMs / 60000);
      await this.smsService.send(
        phoneE164,
        `Tu código SICSA es ${code}. Vence en ${validityMinutes} minutos.`,
      );
    } catch (error) {
      await this.store.invalidate(saved.id, new Date());
      throw error;
    }

    return {
      challengeId: saved.id,
      maskedPhone: maskPhone(phoneE164),
      expiresAt: saved.expiresAt,
    };
  }

  async verify(
    input: VerifyOtpInput,
    onVerified?: (manager: EntityManager, phoneE164: string) => Promise<void>,
  ): Promise<boolean> {
    this.assertCodeFormat(input.code);
    const challenge = await this.store.findForVerification(
      input.challengeId,
      input.userId,
    );
    const now = new Date();
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.invalidatedAt ||
      challenge.expiresAt <= now ||
      challenge.purpose !== input.purpose
    ) {
      throw new BadRequestException('Código inválido o vencido');
    }

    const actual = Buffer.from(challenge.codeHash, 'hex');
    const expected = Buffer.from(this.hmac(`code:${input.code}`), 'hex');
    const matches =
      actual.length === expected.length && timingSafeEqual(actual, expected);
    if (!matches) {
      await this.store.recordFailure(
        challenge.id,
        this.config.maxAttempts,
        now,
      );
      throw new BadRequestException('Código inválido o vencido');
    }

    const consumed = await this.store.consumeIfActive(
      challenge.id,
      now,
      onVerified
        ? (manager, lockedChallenge) =>
            onVerified(manager, lockedChallenge.phoneE164)
        : undefined,
    );
    if (!consumed) {
      throw new BadRequestException('Código inválido o vencido');
    }
    return true;
  }
}
