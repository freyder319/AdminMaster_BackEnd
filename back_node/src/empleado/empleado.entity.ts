import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CajaEntity } from '../caja/caja.entity';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, default: '' })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  apellido!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  documento?: string;

  @Column({ unique: true })
  correo!: string;

  @Column()
  contrasena!: string;

  @Column({ type: 'varchar', length: 20, default: 'INACTIVO' })
  estado!: string;

  @Column({ unique: true, nullable: false })
  telefono?: string;

  @ManyToOne(() => CajaEntity, (caja) => caja.empleados, { nullable: true })
  caja!: CajaEntity;
}
