import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('auditoria_caja')
export class AuditoriaCaja {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'turno_id' })
  turnoId!: number;

  @Column({ type: 'int', name: 'usuario_id', nullable: true })
  usuarioId!: number | null;

  @Column({ type: 'int', name: 'caja_id', nullable: true })
  cajaId!: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'saldo_inicial' })
  saldoInicial!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'saldo_final' })
  saldoFinal!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'saldo_esperado' })
  saldoEsperado!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'diferencia' })
  diferencia!: number;

  @CreateDateColumn({ name: 'fecha_hora_cierre' })
  fechaHoraCierre!: Date;
}
