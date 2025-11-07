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
}
