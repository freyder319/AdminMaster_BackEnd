import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type EstadoVenta = 'confirmada' | 'pendiente';
export type FormaPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros';

@Entity({ name: 'venta_libre' })
export class VentaLibre {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar', length: 20 })
  estado!: EstadoVenta;

  @Column({ type: 'timestamp without time zone', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  fecha_hora!: Date | null;

  @Column({ type: 'jsonb' })
  productos!: Array<{ nombre: string; cantidad: number; precio: number; subtotal: number }>;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  forma_pago!: FormaPago | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transaccionId!: string | null;

  @Column({ type: 'int', nullable: true })
  usuario_id!: number | null;

  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  @Column({ type: 'varchar', length: 20 })
  tipo_venta!: string; // 'libre'

  @Column({ type: 'int', nullable: true })
  turno_id!: number | null;

  @Column({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
