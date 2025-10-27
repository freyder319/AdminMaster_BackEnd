import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any, status?: any) {
    if (err || !user) {
      try {
        const req = context?.switchToHttp?.().getRequest?.();
        const auth = req?.headers?.authorization || '';
        const token = (auth.startsWith('Bearer ') ? auth.substring(7) : undefined) || 'no-token';
        // Logs temporales de diagnóstico
        // Nota: remover en producción
        console.warn('[JwtAuthGuard] Bloqueado. Token=', token.slice(0, 16) + '...');
        if (info) {
          const name = (info as any)?.name || 'UnknownError';
          const message = (info as any)?.message || String(info);
          console.warn(`[JwtAuthGuard] info.name=${name} info.message=${message}`);
        }
        if (err) {
          console.error('[JwtAuthGuard] err=', err?.message || err);
        }
      } catch {}
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
