import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type FormaPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'nequi' | 'daviplata' | 'otros';
export type EstadoGasto = 'confirmado' | 'pendiente' | 'anulado';

@Entity('gastos')
export class GastoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  fecha!: string; // YYYY-MM-DD

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  monto!: string; // almacenar como string para precisión de TypeORM

  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @Column({ type: 'int', name: 'categoria_id', nullable: true })
  categoriaId?: number;

  @Column({ type: 'int', name: 'proveedor_id', nullable: true })
  proveedorId?: number;

  @Column({ type: 'varchar', length: 20 })
  forma_pago!: FormaPago;

  @Column({ type: 'int', name: 'usuario_id', nullable: true })
  usuarioId?: number;

  @Column({ type: 'int', name: 'turno_id', nullable: true })
  turnoId?: number | null;

  @Column({ type: 'varchar', length: 20 })
  estado!: EstadoGasto;
}
