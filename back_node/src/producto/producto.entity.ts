import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { categoria } from 'src/categoria/categoria.entity';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ name: 'codigoProducto', type: 'varchar', length: 50, unique: true })
  codigoProducto!: string;

  @Column({ name: 'imgProducto', type: 'text', nullable: true })
  imgProducto?: string;

  @Column({ name: 'nombreProducto', length: 80 })
  nombreProducto!: string;

  @Column({ name: 'stockProducto', type: 'int' })
  stockProducto!: number;

  @Column({ name: 'precioUnitario', type: 'decimal', precision: 10, scale: 0 })
  precioUnitario!: number;

  @Column({ name: 'precioComercial', type: 'decimal', precision: 10, scale: 0 })
  precioComercial!: number;

  //  Relación con categoría
  @ManyToOne(() => categoria, categoria => categoria.productos)
  @JoinColumn({ name: 'idCategoria' })
  categoria?: categoria;

  @Column({ name: 'estado', type: 'boolean', default: true })
  estado!: boolean;
}
