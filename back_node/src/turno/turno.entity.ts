import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('turnos')
@Index(['usuarioId', 'finTurno'])
export class Turno {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  usuarioId!: number;

  @CreateDateColumn({ name: 'inicio_turno' })
  inicioTurno!: Date;

  @Column({ name: 'fin_turno', type: 'timestamp', nullable: true })
  finTurno?: Date | null;

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ type: 'int', nullable: true })
  aperturaCajaId?: number | null;

  @Column({ type: 'int', nullable: true })
  cierreCajaId?: number | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
