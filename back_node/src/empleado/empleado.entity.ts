import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CajaEntity } from '../caja/caja.entity';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  correo!: string;

  @Column()
  contrasena!: string;

  @Column({ unique: true, nullable: false })
  telefono?: string;

  @ManyToOne(() => CajaEntity, (caja) => caja.empleados, { nullable: true })
  caja!: CajaEntity;
}
