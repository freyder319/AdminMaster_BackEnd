import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('agente_ia_sessions')
export class AgenteIa {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  sessionId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'jsonb', nullable: true })
  history!: unknown | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
