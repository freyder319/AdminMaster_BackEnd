import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('proveedores')
export class ProveedorEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150, nullable: true })
  nombreEmpresa?: string;

  @Column({ length: 30, nullable: true })
  nit?: string;

  @Column({ length: 150, nullable: true })
  contactoNombre?: string;

  @Column({ length: 20 })
  telefono!: string;

  @Column({ length: 150 })
  correo!: string;

  @Column({ default: true })
  activo!: boolean;
}
