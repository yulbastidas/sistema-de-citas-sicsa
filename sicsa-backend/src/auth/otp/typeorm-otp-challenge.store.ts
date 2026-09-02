import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, MoreThanOrEqual } from 'typeorm';
import { OtpChallenge } from './otp-challenge.entity';
import { OtpChallengeStore, OtpRateQuery } from './otp-challenge.store';

@Injectable()
export class TypeOrmOtpChallengeStore implements OtpChallengeStore {
  constructor(private readonly dataSource: DataSource) {}

  private repository() {
    return this.dataSource.getRepository(OtpChallenge);
  }

  countByUser(query: OtpRateQuery): Promise<number> {
    return this.repository().count({
      where: {
        userId: query.userId,
        purpose: query.purpose,
        createdAt: MoreThanOrEqual(query.since),
      },
    });
  }

  countByPhone(query: OtpRateQuery): Promise<number> {
    return this.repository().count({
      where: {
        phoneHash: query.phoneHash,
        purpose: query.purpose,
        createdAt: MoreThanOrEqual(query.since),
      },
    });
  }

  countByIp(query: OtpRateQuery): Promise<number> {
    return this.repository().count({
      where: {
        ipHash: query.ipHash,
        purpose: query.purpose,
        createdAt: MoreThanOrEqual(query.since),
      },
    });
  }

  findLatest(query: Omit<OtpRateQuery, 'since'>): Promise<OtpChallenge | null> {
    return this.repository().findOne({
      where: {
        userId: query.userId,
        phoneHash: query.phoneHash,
        purpose: query.purpose,
      },
      order: { createdAt: 'DESC' },
    });
  }

  createReplacingActive(challenge: OtpChallenge): Promise<OtpChallenge> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OtpChallenge);
      await repository.update(
        {
          userId: challenge.userId,
          purpose: challenge.purpose,
          activeKey: challenge.activeKey!,
        },
        { activeKey: null, invalidatedAt: new Date() },
      );
      return repository.save(challenge);
    });
  }

  async invalidate(id: string, at: Date): Promise<void> {
    await this.repository().update(
      { id },
      { invalidatedAt: at, activeKey: null },
    );
  }

  findForVerification(
    id: string,
    userId: number,
  ): Promise<OtpChallenge | null> {
    return this.repository()
      .createQueryBuilder('challenge')
      .addSelect([
        'challenge.codeHash',
        'challenge.activeKey',
        'challenge.phoneE164',
      ])
      .where('challenge.id = :id AND challenge.userId = :userId', {
        id,
        userId,
      })
      .getOne();
  }

  async recordFailure(
    id: string,
    maxAttempts: number,
    at: Date,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE \`otp_challenge\`
       SET \`attempts\` = \`attempts\` + 1,
           \`invalidatedAt\` = IF(\`attempts\` >= ?, ?, \`invalidatedAt\`),
           \`activeKey\` = IF(\`attempts\` >= ?, NULL, \`activeKey\`)
       WHERE \`id\` = ? AND \`consumedAt\` IS NULL AND \`invalidatedAt\` IS NULL`,
      [maxAttempts, at, maxAttempts, id],
    );
  }

  async consumeIfActive(
    id: string,
    at: Date,
    onConsume?: (
      manager: EntityManager,
      challenge: OtpChallenge,
    ) => Promise<void>,
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OtpChallenge);
      const challenge = await repository
        .createQueryBuilder('challenge')
        .setLock('pessimistic_write')
        .addSelect(['challenge.phoneE164', 'challenge.activeKey'])
        .where(
          'challenge.id = :id AND challenge.consumedAt IS NULL AND challenge.invalidatedAt IS NULL',
          { id },
        )
        .getOne();
      if (!challenge) return false;
      if (onConsume) await onConsume(manager, challenge);
      challenge.consumedAt = at;
      challenge.activeKey = null;
      await repository.save(challenge);
      return true;
    });
  }
}
