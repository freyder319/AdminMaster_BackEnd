import { Controller, Get, Query, Sse, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuditService } from './audit.service';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { SkipThrottle } from '@nestjs/throttler';

interface RequestUser {
  user?: { userId: number; rol?: string };
}

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService, private readonly jwt: JwtService) {}

  private ensureAdmin(req: Request & RequestUser) {
    const rol = (req.user?.rol || '').toString().toLowerCase();
    if (rol !== 'admin') throw new ForbiddenException('Solo admin');
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Req() req: Request & RequestUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.ensureAdmin(req);
    const parsedUserId = userId ? Number(userId) : undefined;
    const res = await this.audit.findPaged({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      module: module || undefined,
      action: action || undefined,
      userId: parsedUserId,
      from,
      to,
    });
    // Mapear campos a DTO esperado por el frontend
    return {
      ...res,
      items: res.items.map((e: any) => ({
        id: e.id,
        timestamp: e.fecha,
        actorUserId: e.actorUserId ?? null,
        actorRol: e.actorRol ?? null,
        module: e.modulo,
        action: e.accion,
        entity: e.entidad ?? null,
        entityId: e.entidadId ?? null,
        route: e.ruta ?? null,
        ip: e.ip ?? null,
        details: e.detalles ?? null,
      })),
    };
  }

  // SSE: EventSource no envía headers personalizados, así que aceptamos ?token=
  // y validamos manualmente el JWT. Solo admins pueden suscribirse.
  @SkipThrottle()
  @Sse('stream')
  stream(@Req() req: Request & RequestUser, @Query('token') token?: string): Observable<MessageEvent> {
    try {
      const header = String(req.headers?.authorization || '');
      const bearer = header.startsWith('Bearer ') ? header.substring(7) : undefined;
      const raw = bearer || token;
      if (!raw) throw new BadRequestException('Falta token');
      const verified: any = this.jwt.verify(raw);
      (req as any).user = { userId: verified?.sub, rol: verified?.rol };
    } catch (e) {
      throw new ForbiddenException('Token inválido');
    }
    this.ensureAdmin(req);
    return this.audit.stream.pipe(
      // Ocultar eventos de login
      map((e) => (e.modulo === 'auth' && e.accion === 'login' ? null : e)),
      // Ocultar creaciones de ventas y gastos
      map((e) => (e && ((e.modulo === 'venta' && e.accion === 'create') || (e.modulo === 'gasto' && e.accion === 'create')) ? null : e)),
      // Filtrar nulls
      map((e) => (e ? ({ data: {
        id: e.id,
        timestamp: e.fecha,
        actorUserId: e.actorUserId ?? null,
        actorRol: e.actorRol ?? null,
        module: (e as any).modulo,
        action: (e as any).accion,
        entity: (e as any).entidad ?? null,
        entityId: (e as any).entidadId ?? null,
        route: (e as any).ruta ?? null,
        ip: (e as any).ip ?? null,
        details: (e as any).detalles ?? null,
      }} as MessageEvent) : (undefined as any)))
    );
  }
}
