import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  AuthRateLimitConfig,
  getAuthRateLimitConfig,
} from '../../config/environment';

interface LoginFailureEntry {
  failures: number[];
  blockedUntil: number;
  lastTouched: number;
}

@Injectable()
export class AuthRateLimitService {
  private readonly logger = new Logger(AuthRateLimitService.name);
  private readonly entries = new Map<string, LoginFailureEntry>();
  private readonly cooldowns = new Map<string, number>();
  private readonly config: AuthRateLimitConfig = getAuthRateLimitConfig();
  private readonly maximumEntries = 10_000;

  normalizeIdentifier(identifier: string): string {
    return identifier.trim().toLowerCase();
  }

  getLoginRetryAfterSeconds(ip: string, identifier: string): number {
    const now = Date.now();
    const key = this.buildKey(ip, identifier);
    const entry = this.entries.get(key);

    if (!entry) return 0;

    this.pruneFailures(entry, now);

    if (entry.blockedUntil <= now) {
      if (entry.failures.length === 0) this.entries.delete(key);
      return 0;
    }

    entry.lastTouched = now;
    return Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000));
  }

  recordLoginFailure(ip: string, identifier: string): number {
    const now = Date.now();
    const key = this.buildKey(ip, identifier);
    const entry = this.entries.get(key) ?? {
      failures: [],
      blockedUntil: 0,
      lastTouched: now,
    };

    this.pruneFailures(entry, now);
    entry.failures.push(now);
    entry.lastTouched = now;

    if (entry.failures.length >= this.config.loginMaxAttempts) {
      entry.blockedUntil = now + this.config.loginBlockMs;
      this.logger.warn(
        `Límite temporal de autenticación alcanzado ip=${this.fingerprint(ip)} identifier=${this.fingerprint(this.normalizeIdentifier(identifier))}`,
      );
    } else {
      this.logger.warn(
        `Intento de autenticación fallido ip=${this.fingerprint(ip)} identifier=${this.fingerprint(this.normalizeIdentifier(identifier))}`,
      );
    }

    this.entries.set(key, entry);
    this.limitMemoryUsage(now);

    return this.getLoginRetryAfterSeconds(ip, identifier);
  }

  clearLoginFailures(ip: string, identifier: string): void {
    this.entries.delete(this.buildKey(ip, identifier));
  }

  consumeIdentifierCooldown(
    action: string,
    ip: string,
    identifier: string,
  ): number {
    const now = Date.now();
    const key = this.fingerprint(
      `${action}|${ip}|${this.normalizeIdentifier(identifier)}`,
    );
    const blockedUntil = this.cooldowns.get(key) ?? 0;

    if (blockedUntil > now) {
      return Math.max(1, Math.ceil((blockedUntil - now) / 1000));
    }

    this.cooldowns.set(key, now + this.config.codeResendCooldownMs);
    this.pruneCooldowns(now);
    return 0;
  }

  private buildKey(ip: string, identifier: string): string {
    return this.fingerprint(`${ip}|${this.normalizeIdentifier(identifier)}`);
  }

  private fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 16);
  }

  private pruneFailures(entry: LoginFailureEntry, now: number): void {
    const windowStart = now - this.config.loginWindowMs;
    entry.failures = entry.failures.filter(
      (timestamp) => timestamp > windowStart,
    );

    if (entry.blockedUntil <= now) entry.blockedUntil = 0;
  }

  private limitMemoryUsage(now: number): void {
    if (this.entries.size <= this.maximumEntries) return;

    for (const [key, entry] of this.entries) {
      this.pruneFailures(entry, now);
      if (entry.failures.length === 0 && entry.blockedUntil === 0) {
        this.entries.delete(key);
      }
    }

    if (this.entries.size <= this.maximumEntries) return;

    const oldestEntries = [...this.entries.entries()].sort(
      ([, left], [, right]) => left.lastTouched - right.lastTouched,
    );

    for (const [key] of oldestEntries.slice(
      0,
      this.entries.size - this.maximumEntries,
    )) {
      this.entries.delete(key);
    }
  }

  private pruneCooldowns(now: number): void {
    if (this.cooldowns.size <= this.maximumEntries) return;

    for (const [key, blockedUntil] of this.cooldowns) {
      if (blockedUntil <= now) this.cooldowns.delete(key);
    }

    if (this.cooldowns.size <= this.maximumEntries) return;

    for (const key of [...this.cooldowns.keys()].slice(
      0,
      this.cooldowns.size - this.maximumEntries,
    )) {
      this.cooldowns.delete(key);
    }
  }
}
