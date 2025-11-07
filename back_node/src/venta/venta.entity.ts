import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { VentaItem } from './venta-item.entity';

@Entity('ventas')
export class Venta {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @Column({ name: 'forma_pago', type: 'varchar', length: 20 })
  forma_pago!: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros';

  @CreateDateColumn({ name: 'fecha_hora' })
  fecha_hora!: Date;

  @Column({ type: 'int', nullable: true })
  usuarioId?: number | null;

  @Column({ type: 'int', nullable: true })
  turnoId?: number | null;

  @OneToMany(() => VentaItem, (item: VentaItem) => item.venta, { cascade: true })
  items!: VentaItem[];

  @Column({ type: 'int', nullable: true })
  descuentoId?: number | null;
}
