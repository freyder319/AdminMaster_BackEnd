import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'configuracion_negocio' })
export class ConfiguracionNegocio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  nombreNegocio!: string;

  @Column({ length: 200 })
  direccion!: string;

  @Column({ length: 100 })
  ciudad!: string;

  @Column({ length: 30 })
  celular!: string;

  @Column({ length: 150 })
  correo!: string;

  @Column({ length: 50 })
  documento!: string;

  @Column({ nullable: true })
  logoUrl?: string;
}
