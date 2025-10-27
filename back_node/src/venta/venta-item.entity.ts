import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Venta } from './venta.entity';
import { Producto } from 'src/producto/producto.entity';

@Entity('venta_items')
export class VentaItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Venta, (venta) => venta.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_id' })
  venta!: Venta;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto!: Producto;

  @Column({ type: 'int' })
  cantidad!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  precio!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;
}
