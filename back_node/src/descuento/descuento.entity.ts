import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('descuentos')
export class DescuentoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  @Index({ unique: true })
  nombre!: string;

  @Column({ type: 'int' })
  porcentaje!: number; // 1 - 100

  @Column({ type: 'bigint' })
  creadoEn!: string; // guardar como string para bigint en pg

  // Tipo básico de promoción: por porcentaje (actual) o valor fijo (para futuras extensiones)
  @Column({ type: 'varchar', length: 20, default: 'PORCENTAJE' })
  tipo!: 'PORCENTAJE' | 'VALOR_FIJO';

  // Vigencia opcional de la promoción
  @Column({ type: 'timestamp', nullable: true })
  fechaInicio?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  fechaFin?: Date | null;

  // Permite desactivar una promoción sin eliminarla
  @Column({ type: 'boolean', default: true })
  activo!: boolean;
}
