import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pqrs')
export class PqrsEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 60 })
  nombre!: string;

  @Column({ type: 'varchar', length: 60 })
  apellido!: string;

  @Column({ type: 'varchar', length: 80 })
  correo!: string;

  @Column({ type: 'varchar', length: 20 })
  numero!: string;

  @Column({ type: 'text' })
  comentarios!: string;

  @Column({ type: 'boolean', default: false })
  autorizo!: boolean;

  @CreateDateColumn()
  creadoEn!: Date;
}
