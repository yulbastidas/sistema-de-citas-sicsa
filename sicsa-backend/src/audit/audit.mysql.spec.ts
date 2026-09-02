import dataSource from '../database/data-source';
import { AuditEvent } from './entities/audit-event.entity';

const describeMysql =
  process.env.RUN_MYSQL_INTEGRATION === 'true' ? describe : describe.skip;

describeMysql('Audit persistence (MySQL)', () => {
  beforeAll(async () => {
    if (!dataSource.isInitialized) await dataSource.initialize();
  });
  afterAll(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });
  afterEach(async () => {
    await dataSource.getRepository(AuditEvent).clear();
  });

  it('stores nullable actors and supports resource lookup', async () => {
    const repository = dataSource.getRepository(AuditEvent);
    await repository.save(
      repository.create({
        actorUserId: null,
        actorRole: 'system',
        action: 'appointment.promoted',
        resourceType: 'appointment',
        resourceId: '77',
        result: 'success',
        occurredAt: new Date(),
        correlationId: null,
        ipFingerprint: null,
        metadata: { status: 'confirmada' },
      }),
    );
    const found = await repository.findOneByOrFail({
      resourceType: 'appointment',
      resourceId: '77',
    });
    expect(found.actorUserId).toBeNull();
    expect(found.metadata).toEqual({ status: 'confirmada' });
  });

  it('has the operational audit indexes', async () => {
    const rawIndexes: unknown = await dataSource.query(
      'SHOW INDEX FROM `audit_event`',
    );
    const indexes = rawIndexes as Array<{ Key_name: string }>;
    const names = indexes.map((row) => row.Key_name);
    expect(names).toEqual(
      expect.arrayContaining([
        'IDX_audit_occurred_at',
        'IDX_audit_actor_occurred',
        'IDX_audit_resource_occurred',
        'IDX_audit_action_occurred',
      ]),
    );
  });
});
