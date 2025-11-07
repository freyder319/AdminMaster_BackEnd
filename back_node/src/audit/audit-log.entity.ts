import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  fecha!: Date;

  @Column({ type: 'int', nullable: true })
  actorUserId!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  actorRol!: string | null;

  @Column({ type: 'varchar', length: 50 })
  modulo!: string; // clientes, proveedores, ventas, caja, gastos, pqrs, auth, etc.

  @Column({ type: 'varchar', length: 50 })
  accion!: string; // create, update, delete, open, close, login, logout, etc.

  @Column({ type: 'varchar', length: 80, nullable: true })
  entidad!: string | null; // Cliente, Venta, Gasto, etc.

  @Column({ type: 'varchar', length: 80, nullable: true })
  entidadId!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  ruta!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  detalles!: Record<string, any> | null;
}
