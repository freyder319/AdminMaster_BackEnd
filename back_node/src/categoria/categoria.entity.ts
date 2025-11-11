import { Producto } from 'src/producto/producto.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
@Entity('categorias')
export class categoria {
  @PrimaryGeneratedColumn({ name: 'idCategoria' })
  idCategoria!: number;

  @Column({ name: 'nombreCategoria', type: 'varchar', length: 100 })
  nombreCategoria!: string;
  // Normalizado en minúsculas y trim para unicidad case-insensitive
  @Column({ name: 'nombreNormalizado', type: 'varchar', length: 110, unique: true, nullable: true })
  nombreNormalizado!: string | null;
  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos!: Producto[];
}
