import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { Subject } from 'rxjs';

export interface CreateAuditDto {
  actorUserId?: number | null;
  actorRol?: string | null;
  module: string;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  route?: string | null;
  ip?: string | null;
  details?: Record<string, any> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  private events$ = new Subject<AuditLog>();

  get stream() {
    return this.events$.asObservable();
  }

  async log(dto: CreateAuditDto): Promise<AuditLog> {
    // Mapear DTO (en inglés) a columnas (en español) y guardar directamente
    const partial: Partial<AuditLog> = {
      actorUserId: dto.actorUserId ?? null,
      actorRol: dto.actorRol ?? null,
      modulo: dto.module,
      accion: dto.action,
      entidad: dto.entity ?? null,
      entidadId: dto.entityId ?? null,
      ruta: dto.route ?? null,
      ip: dto.ip ?? null,
      detalles: dto.details ?? null,
    };
    const saved = await this.repo.save(partial as any);
    try { this.events$.next(saved); } catch {}
    return saved;
  }

  async findPaged(params: { page?: number; pageSize?: number; module?: string; action?: string; userId?: number; from?: string; to?: string; }): Promise<{ items: AuditLog[]; total: number; page: number; pageSize: number; }> {
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize || 20)));

    const where: FindOptionsWhere<AuditLog> = {};
    if (params.module) (where as any).modulo = params.module;
    if (params.action) (where as any).accion = params.action;
    if (params.userId) (where as any).actorUserId = params.userId;

    const qb = this.repo.createQueryBuilder('a').where(where);
    // Excluir inicios de sesión del historial visible
    qb.andWhere("NOT (a.modulo = :m AND a.accion = :act)", { m: 'auth', act: 'login' });
    // Excluir creaciones de ventas y gastos del historial visible
    qb.andWhere(
      "NOT ((a.modulo = :m1 AND a.accion = :a1) OR (a.modulo = :m2 AND a.accion = :a2))",
      { m1: 'venta', a1: 'create', m2: 'gasto', a2: 'create' }
    );
    if (params.from) qb.andWhere('a.fecha >= :from', { from: new Date(params.from) });
    if (params.to) qb.andWhere('a.fecha <= :to', { to: new Date(params.to) });
    qb.orderBy('a.fecha', 'DESC').skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }
}

