import { Controller, Get, Param, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { TurnoService } from './turno.service';
import { IniciarTurnoDto } from './dto/iniciar-turno.dto';
import { CerrarTurnoDto } from './dto/cerrar-turno.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('turno')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) {}

  @UseGuards(JwtAuthGuard)
  @Post('iniciar')
  iniciar(@Req() req: any, @Body() dto: IniciarTurnoDto) {
    return this.turnoService.iniciarTurno(req.user.userId, dto);
  }

  // Fallback público: iniciar turno por usuarioId sin JWT (usar solo si es estrictamente necesario)
  @Post('iniciar-por-usuario/:usuarioId')
  iniciarPorUsuario(@Param('usuarioId') usuarioId: string, @Body() dto: IniciarTurnoDto) {
    return this.turnoService.iniciarTurno(Number(usuarioId), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cerrar')
  cerrar(@Req() req: any, @Body() dto: CerrarTurnoDto) {
    return this.turnoService.cerrarTurno(req.user.userId, dto);
  }

  // Fallback público: cerrar turno por usuarioId sin JWT (usar solo si es estrictamente necesario)
  @Post('cerrar-por-usuario/:usuarioId')
  cerrarPorUsuario(@Param('usuarioId') usuarioId: string, @Body() dto: CerrarTurnoDto) {
    return this.turnoService.cerrarTurno(Number(usuarioId), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('activo')
  activo(@Req() req: any) {
    return this.turnoService.getResumenActivo(req.user.userId);
  }

  @Get('ultimo/:empleadoId')
  ultimo(@Param('empleadoId') empleadoId: string) {
    return this.turnoService.getUltimoTurno(Number(empleadoId));
  }

  @Get('resumen/:empleadoId')
  resumen(@Param('empleadoId') empleadoId: string) {
    return this.turnoService.getResumenPorEmpleado(Number(empleadoId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('activos')
  activos() {
    return this.turnoService.listActivos();
  }

  @Get('activos-public')
  @SkipThrottle()
  activosPublic() {
    return this.turnoService.listActivos();
  }

  @UseGuards(JwtAuthGuard)
  @Get('cerrados')
  cerrados() {
    return this.turnoService.listCerrados();
  }

  @Get('cerrados-public')
  @SkipThrottle()
  cerradosPublic() {
    return this.turnoService.listCerrados();
  }

  // Endpoint unificado público: activos + cerrados en una sola respuesta
  @Get('overview-public')
  @SkipThrottle()
  overviewPublic() {
    return this.turnoService.listActivosYCerrados();
  }
}
