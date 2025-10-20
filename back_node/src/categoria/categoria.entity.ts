import { Producto } from 'src/producto/producto.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
@Entity('categorias')
export class categoria {
  @PrimaryGeneratedColumn({ name: 'idCategoria' })
  idCategoria!: number;

  @Column({ name: 'nombreCategoria', type: 'varchar', length: 100 })
  nombreCategoria!: string;
  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos!: Producto[];
}
