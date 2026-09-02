import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from './entities/audit-event.entity';

export interface AuditRecord {
  actorUserId?: number | null;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string | number | null;
  result: 'success' | 'failure';
  correlationId?: string | null;
  ipFingerprint?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

const SENSITIVE_KEYS =
  /password|token|otp|secret|code|jwt|clinical|medical|reason/i;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditEvent)
    private readonly events: Repository<AuditEvent>,
  ) {}

  async record(record: AuditRecord): Promise<void> {
    try {
      await this.events.save(
        this.events.create({
          actorUserId: record.actorUserId ?? null,
          actorRole: record.actorRole.slice(0, 30),
          action: record.action.slice(0, 80),
          resourceType: record.resourceType.slice(0, 50),
          resourceId:
            record.resourceId === null || record.resourceId === undefined
              ? null
              : String(record.resourceId).slice(0, 80),
          result: record.result,
          occurredAt: new Date(),
          correlationId: record.correlationId?.slice(0, 80) ?? null,
          ipFingerprint: record.ipFingerprint?.slice(0, 64) ?? null,
          metadata: this.sanitizeMetadata(record.metadata),
        }),
      );
    } catch (error) {
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`Audit persistence failed: ${errorName}`);
    }
  }

  private sanitizeMetadata(
    metadata?: Record<string, string | number | boolean | null>,
  ): Record<string, string | number | boolean | null> | null {
    if (!metadata) return null;
    return Object.fromEntries(
      Object.entries(metadata)
        .filter(([key]) => !SENSITIVE_KEYS.test(key))
        .slice(0, 12)
        .map(([key, value]) => [key.slice(0, 50), value]),
    );
  }
}
