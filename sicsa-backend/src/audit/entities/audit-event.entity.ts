import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_event' })
export class AuditEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'int', nullable: true })
  actorUserId!: number | null;

  @Column({ type: 'varchar', length: 30 })
  actorRole!: string;

  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ type: 'varchar', length: 50 })
  resourceType!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  resourceId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  result!: string;

  @Column({ type: 'datetime', precision: 3 })
  occurredAt!: Date;

  @Column({ type: 'varchar', length: 80, nullable: true })
  correlationId!: string | null;

  @Column({ type: 'char', length: 64, nullable: true })
  ipFingerprint!: string | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, string | number | boolean | null> | null;
}
