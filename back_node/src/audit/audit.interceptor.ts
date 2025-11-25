import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req: any = ctx.getRequest();

    const method: string = (req?.method || '').toUpperCase();
    const url: string = String(req?.originalUrl || req?.url || '');
    const ip: string | null = req?.ip || null;
    const actorUserId: number | null = req?.user?.userId ?? null;
    const actorRol: string | null = req?.user?.rol ?? null;

    // Inferir módulo (primer segmento del path)
    const module = (() => {
      const path = url.split('?')[0] || '';
      const parts = path.split('/').filter(Boolean);
      return (parts[0] || '').toLowerCase();
    })();

    // Limitar a módulos de negocio
    const allowed = new Set(['cliente','proveedor','empleado','venta','venta-libre','caja','gasto','pqrs','configuracion','descuento','report','producto','categoria']);
    if (!allowed.has(module)) {
      return next.handle();
    }

    // Acción por método y heurística de ruta
    const action = (() => {
      const lower = url.toLowerCase();
      if (module === 'caja') {
        if (lower.includes('apertura')) return 'open';
        if (lower.includes('cierre')) return 'close';
      }
      if (method === 'POST') return 'create';
      if (method === 'PUT' || method === 'PATCH') return 'update';
      if (method === 'DELETE') return 'delete';
      if (method === 'GET') return 'read';
      return method.toLowerCase();
    })();

    // No registrar lecturas/consultas: solo cambios y acciones relevantes
    if (action === 'read') {
      return next.handle();
    }

    // Entidad e ID por defecto a partir del módulo y params
    const entity = module ? module.charAt(0).toUpperCase() + module.slice(1) : null;
    const entityId = (req?.params?.id ? String(req.params.id) : null);

    // Quitar campos sensibles e IMAGENES del body (recursivo)
    const IMAGE_KEYS = new Set(['imagen','image','foto','photo','img','imgproducto','picture','logo','icon','avatar']);
    const isImageLike = (val: any) => typeof val === 'string' && (val.startsWith('data:image') || val.length > 200);
    const sanitize = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (Array.isArray(obj)) {
        return obj.map((v) => sanitize(v));
      }
      if (typeof obj !== 'object') {
        return isImageLike(obj) ? '[imagen omitida]' : obj;
      }
      const out: any = {};
      for (const [k, v] of Object.entries(obj)) {
        const key = String(k).toLowerCase();
        if (IMAGE_KEYS.has(key)) continue; // eliminar claves de imagen completamente
        if (key === 'contrasena' || key === 'password' || key === 'token') continue;
        const sv = sanitize(v);
        // si tras sanitizar queda null y no es boolean/0/etc, ignorar
        if (sv === null || sv === undefined) continue;
        out[k] = sv;
      }
      return out;
    };

    let details = sanitize(req?.body);

    // Enriquecer detalles con información básica del usuario (si está disponible)
    try {
      const user: any = req?.user || null;
      if (user && (actorUserId != null || user.id != null)) {
        if (!details || typeof details !== 'object') details = {} as any;
        const nombre = user.nombre ?? user.empleadoNombre ?? null;
        const apellido = user.apellido ?? user.empleadoApellido ?? null;
        const correo = user.correo ?? null;
        const actorUser = {
          id: actorUserId ?? user.id ?? null,
          rol: actorRol ?? user.rol ?? null,
          nombre,
          apellido,
          correo,
        };
        (details as any).actorUser = actorUser;
        if (nombre || apellido) {
          (details as any).actorNombre = `${nombre || ''} ${apellido || ''}`.trim();
        }
      }
    } catch {}

    // Enriquecer detalles para categoria con nombre, para no depender del ID
    if (module === 'categoria') {
      try {
        const nombre = req?.body?.nombre;
        if (nombre) {
          if (!details || typeof details !== 'object') details = {} as any;
          // si hay estructura de cambios, completar AFTER
          if ((details as any).after && typeof (details as any).after === 'object') {
            (details as any).after.nombre = nombre;
          } else if ((details as any).changes && typeof (details as any).changes === 'object') {
            const ch = (details as any).changes;
            ch.nombre = ch.nombre || {};
            ch.nombre.after = nombre;
          } else {
            (details as any).nombre = nombre;
          }
        }
      } catch {}
    }

    return next.handle().pipe(
      tap({
        next: async (res) => {
          try {
            await this.audit.log({
              module,
              action,
              actorUserId,
              actorRol,
              entity,
              entityId,
              route: url,
              ip,
              details,
            });
          } catch {}
        },
        error: () => {
          // No registrar en caso de error (o podríamos registrar con action=error)
        },
      }),
    );
  }
}
