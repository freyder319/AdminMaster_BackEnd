import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('turno_logs')
@Index(['turnoId', 'fecha'])
export class TurnoLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  turnoId!: number;

  @Column({ type: 'varchar', length: 60 })
  tipo!: string; // ej: venta_create, cliente_update

  @Column({ type: 'varchar', length: 60, nullable: true })
  refId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload?: any | null;

  @CreateDateColumn()
  fecha!: Date;
}
