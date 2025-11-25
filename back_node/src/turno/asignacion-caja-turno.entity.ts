import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('asignaciones_caja_turno')
export class AsignacionCajaTurno {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'usuario_id', nullable: true })
  usuarioId!: number | null;

  @Column({ type: 'int', name: 'empleado_id', nullable: true })
  empleadoId!: number | null;

  @Column({ type: 'int', name: 'caja_id', nullable: true })
  cajaId!: number | null;

  @Column({ type: 'int', name: 'turno_id' })
  turnoId!: number;

  @CreateDateColumn({ name: 'hora_asignacion' })
  horaAsignacion!: Date;

  @Column({ type: 'timestamp', name: 'hora_liberacion', nullable: true })
  horaLiberacion!: Date | null;
}
