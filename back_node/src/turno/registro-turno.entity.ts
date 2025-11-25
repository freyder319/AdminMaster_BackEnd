import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

export type BloqueTurno = 'manana' | 'tarde' | 'noche';

@Entity('registro_turnos')
@Index(['fecha', 'bloque'])
export class RegistroTurno {
  @PrimaryGeneratedColumn()
  id!: number;

  // Fecha del día al que pertenece el turno (sin hora)
  @Column({ type: 'date' })
  fecha!: string; // YYYY-MM-DD

  // Jornada del día: mañana, tarde o noche
  @Column({ type: 'varchar', length: 20 })
  bloque!: BloqueTurno;

  // Hora de inicio de la jornada (opcional)
  @Column({ type: 'time', name: 'hora_desde', nullable: true })
  horaDesde?: string | null;

  // Hora de fin de la jornada (opcional)
  @Column({ type: 'time', name: 'hora_hasta', nullable: true })
  horaHasta?: string | null;

  // Notas opcionales sobre este turno (por ejemplo tareas a realizar)
  @Column({ type: 'text', nullable: true })
  notas?: string | null;

  @Column({ type: 'int', name: 'turno_id', nullable: true })
  turnoId?: number | null;

  // Fecha/hora de creación del registro
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
