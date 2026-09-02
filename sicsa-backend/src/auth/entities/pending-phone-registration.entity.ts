import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pending_phone_registration')
@Index('UQ_pending_phone_registration_email', ['email'], { unique: true })
@Index('UQ_pending_phone_registration_phone', ['phoneE164'], { unique: true })
@Index('UQ_pending_phone_registration_document', ['documentNumber'], {
  unique: true,
})
export class PendingPhoneRegistration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  email!: string;

  @Column({ type: 'varchar', length: 13 })
  phoneE164!: string;

  @Column({ type: 'varchar', length: 20 })
  documentNumber!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'text', select: false })
  registrationData!: string;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date;
}
