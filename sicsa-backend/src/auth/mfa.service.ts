import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { DataSource, IsNull, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { MfaChallenge } from './entities/mfa-challenge.entity';
import { MfaCredential } from './entities/mfa-credential.entity';
import { MfaRecoveryCode } from './entities/mfa-recovery-code.entity';
import { requireEnvironmentValue } from '../config/environment';

const INVALID = 'Código de verificación inválido o expirado';

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(MfaCredential) private credentials: Repository<MfaCredential>,
    @InjectRepository(MfaChallenge) private challenges: Repository<MfaChallenge>,
    @InjectRepository(MfaRecoveryCode) private recoveryCodes: Repository<MfaRecoveryCode>,
    private dataSource: DataSource,
  ) {
    authenticator.options = { step: 30, window: 1 };
  }

  async begin(user: User) {
    let credential = await this.credentials.createQueryBuilder('mfa').addSelect('mfa.encryptedSecret').where('mfa.userId = :userId', { userId: user.id }).getOne();
    const enrollmentRequired = !credential?.enabled;
    let manualKey: string | undefined;
    let qrCodeDataUrl: string | undefined;
    if (!credential) {
      manualKey = authenticator.generateSecret();
      credential = await this.credentials.save(this.credentials.create({ userId: user.id, encryptedSecret: this.encrypt(manualKey), enabled: false, enrolledAt: null }));
      const uri = authenticator.keyuri(user.email, 'SICSA', manualKey);
      qrCodeDataUrl = await QRCode.toDataURL(uri, { errorCorrectionLevel: 'M', width: 240 });
    } else if (enrollmentRequired) {
      manualKey = this.decrypt(credential.encryptedSecret);
      qrCodeDataUrl = await QRCode.toDataURL(authenticator.keyuri(user.email, 'SICSA', manualKey), { errorCorrectionLevel: 'M', width: 240 });
    }
    await this.challenges.update({ userId: user.id, usedAt: IsNull() }, { usedAt: new Date() });
    const token = randomBytes(32).toString('base64url');
    await this.challenges.save(this.challenges.create({ userId: user.id, tokenHash: this.hash(token), purpose: enrollmentRequired ? 'enroll' : 'login', expiresAt: new Date(Date.now() + 5 * 60_000), usedAt: null, attempts: 0 }));
    return { requiresTwoFactor: true, enrollmentRequired, challengeToken: token, expiresInSeconds: 300, ...(enrollmentRequired ? { qrCodeDataUrl, manualKey } : {}) };
  }

  async complete(token: string, method: 'totp' | 'recovery', codeRaw: string): Promise<{ user: User; recoveryCodes?: string[] }> {
    const code = codeRaw.trim().toUpperCase();
    const result = await this.dataSource.transaction(async (manager) => {
      const challenge = await manager.getRepository(MfaChallenge).createQueryBuilder('challenge').setLock('pessimistic_write').where('challenge.tokenHash = :hash', { hash: this.hash(token) }).getOne();
      if (!challenge || challenge.usedAt || challenge.expiresAt <= new Date() || challenge.attempts >= 5) return null;
      const credential = await manager.getRepository(MfaCredential).createQueryBuilder('mfa').addSelect('mfa.encryptedSecret').where('mfa.userId = :userId', { userId: challenge.userId }).getOne();
      if (!credential) return null;
      let valid = false;
      const currentStep = Math.floor(Date.now() / 30_000);
      const delta = method === 'totp' && /^\d{6}$/.test(code) ? authenticator.checkDelta(code, this.decrypt(credential.encryptedSecret)) : null;
      const acceptedStep = delta === null ? null : (currentStep + delta).toString();
      if (acceptedStep !== null && credential.lastUsedTotpStep !== acceptedStep) valid = true;
      if (method === 'recovery' && challenge.purpose === 'login' && credential.enabled) valid = await this.consumeRecoveryCode(manager.getRepository(MfaRecoveryCode), challenge.userId, code);
      if (!valid) {
        challenge.attempts += 1;
        await manager.getRepository(MfaChallenge).save(challenge);
        return null;
      }
      challenge.usedAt = new Date();
      await manager.getRepository(MfaChallenge).save(challenge);
      if (method === 'totp') {
        credential.lastUsedTotpStep = acceptedStep;
        await manager.getRepository(MfaCredential).save(credential);
      }
      let plainCodes: string[] | undefined;
      if (challenge.purpose === 'enroll') {
        if (method !== 'totp') throw new UnauthorizedException(INVALID);
        credential.enabled = true;
        credential.enrolledAt = new Date();
        await manager.getRepository(MfaCredential).save(credential);
        plainCodes = await this.replaceRecoveryCodes(manager.getRepository(MfaRecoveryCode), challenge.userId);
      }
      const user = await manager.getRepository(User).findOneByOrFail({ id: challenge.userId });
      return { user, recoveryCodes: plainCodes };
    });
    if (!result) throw new UnauthorizedException(INVALID);
    return result;
  }

  async regenerate(userId: number, totp: string): Promise<string[]> {
    const credential = await this.credentials.createQueryBuilder('mfa').addSelect('mfa.encryptedSecret').where('mfa.userId = :userId AND mfa.enabled = true', { userId }).getOne();
    const currentStep = Math.floor(Date.now() / 30_000);
    const delta = credential ? authenticator.checkDelta(totp, this.decrypt(credential.encryptedSecret)) : null;
    const acceptedStep = delta === null ? null : (currentStep + delta).toString();
    if (!credential || acceptedStep === null || credential.lastUsedTotpStep === acceptedStep) throw new BadRequestException(INVALID);
    credential.lastUsedTotpStep = acceptedStep;
    await this.credentials.save(credential);
    const codes = await this.replaceRecoveryCodes(this.recoveryCodes, userId);
    await this.dataSource.getRepository(User).increment({ id: userId }, 'tokenVersion', 1);
    return codes;
  }

  private async consumeRecoveryCode(repo: Repository<MfaRecoveryCode>, userId: number, code: string) {
    const candidates = await repo.createQueryBuilder('code').addSelect('code.codeHash').where('code.userId = :userId AND code.usedAt IS NULL', { userId }).getMany();
    for (const candidate of candidates) if (await bcrypt.compare(code, candidate.codeHash)) { candidate.usedAt = new Date(); await repo.save(candidate); return true; }
    return false;
  }
  private async replaceRecoveryCodes(repo: Repository<MfaRecoveryCode>, userId: number) {
    await repo.delete({ userId });
    const plain = Array.from({ length: 8 }, () => randomBytes(6).toString('hex').toUpperCase());
    await repo.save(await Promise.all(plain.map(async (code) => repo.create({ userId, codeHash: await bcrypt.hash(code, 10), usedAt: null }))));
    return plain;
  }
  private key() { const raw = Buffer.from(requireEnvironmentValue('MFA_ENCRYPTION_KEY'), 'base64'); if (raw.length !== 32) throw new Error('MFA_ENCRYPTION_KEY debe ser Base64 de 32 bytes'); return raw; }
  private encrypt(value: string) { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key(), iv); const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return [iv, cipher.getAuthTag(), encrypted].map((v) => v.toString('base64url')).join('.'); }
  private decrypt(value: string) { const [iv, tag, encrypted] = value.split('.').map((v) => Buffer.from(v, 'base64url')); const decipher = createDecipheriv('aes-256-gcm', this.key(), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'); }
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
}
