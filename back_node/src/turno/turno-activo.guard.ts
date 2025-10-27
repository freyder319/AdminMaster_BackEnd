import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { TurnoService } from './turno.service';

@Injectable()
export class TurnoActivoGuard implements CanActivate {
  constructor(private readonly turnoService: TurnoService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req?.user;
    // Si no hay usuario en request, permitir y que otro guard de auth falle si corresponde
    if (!user) return true;
    const rol = String(user.rol || '').toLowerCase();
    if (rol !== 'punto_pos') return true; // Sólo aplica a punto_pos

    const userId = Number((user as any).userId ?? (user as any).id);
    if (!userId) throw new ForbiddenException('Usuario inválido');

    const turno = await this.turnoService.getTurnoActivo(userId);
    if (!turno) throw new ForbiddenException('Debes iniciar un turno activo para realizar esta acción');
    return true;
  }
}
