import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('proveedores')
export class ProveedorEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ length: 100, nullable: true })
  apellido?: string;

  @Column({ length: 20 })
  telefono!: string;

  @Column({ length: 150 })
  correo!: string;

  @Column({ default: true })
  activo!: boolean;
}
