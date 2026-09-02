import { EntityManager } from 'typeorm';
import { OtpChallenge } from './otp-challenge.entity';
import { OtpPurpose } from './otp-purpose';

export type OtpRateQuery = {
  userId: number;
  phoneHash: string;
  ipHash: string;
  purpose: OtpPurpose;
  since: Date;
};

export interface OtpChallengeStore {
  countByUser(query: OtpRateQuery): Promise<number>;
  countByPhone(query: OtpRateQuery): Promise<number>;
  countByIp(query: OtpRateQuery): Promise<number>;
  findLatest(query: Omit<OtpRateQuery, 'since'>): Promise<OtpChallenge | null>;
  createReplacingActive(challenge: OtpChallenge): Promise<OtpChallenge>;
  invalidate(id: string, at: Date): Promise<void>;
  findForVerification(id: string, userId: number): Promise<OtpChallenge | null>;
  recordFailure(id: string, maxAttempts: number, at: Date): Promise<void>;
  consumeIfActive(
    id: string,
    at: Date,
    onConsume?: (
      manager: EntityManager,
      challenge: OtpChallenge,
    ) => Promise<void>,
  ): Promise<boolean>;
}

export const OTP_CHALLENGE_STORE = Symbol('OTP_CHALLENGE_STORE');
