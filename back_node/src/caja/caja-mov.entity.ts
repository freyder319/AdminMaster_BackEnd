import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type CajaTipo = 'APERTURA' | 'CIERRE';

@Entity('caja_movimientos')
export class CajaMovimiento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  usuarioId!: number;

  @CreateDateColumn()
  fecha!: Date;

  @Column({ type: 'enum', enum: ['APERTURA', 'CIERRE'], enumName: 'caja_mov_tipo' })
  tipo!: CajaTipo;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  monto!: number;
}
