import { Controller, Get, Param, Post, Body, UseGuards, Req, Query, Delete } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { TurnoService } from './turno.service';
import { RegistroTurnoService } from './registro-turno.service';
import { IniciarTurnoDto } from './dto/iniciar-turno.dto';
import { CerrarTurnoDto } from './dto/cerrar-turno.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('turno')
export class TurnoController {
  constructor(
    private readonly turnoService: TurnoService,
    private readonly registroTurnoService: RegistroTurnoService,
  ) {}

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

  @UseGuards(JwtAuthGuard)
  @Get('auditoria')
  listAuditoria(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('cajaId') cajaId?: string,
  ) {
    return this.turnoService.listAuditoriaCaja({
      from,
      to,
      usuarioId: usuarioId ? Number(usuarioId) : undefined,
      cajaId: cajaId ? Number(cajaId) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('horas-por-empleado')
  reporteHorasPorEmpleado(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.turnoService.reporteHorasPorEmpleado({ from, to });
  }

  // Endpoint unificado público: activos + cerrados en una sola respuesta
  @Get('overview-public')
  @SkipThrottle()
  overviewPublic() {
    return this.turnoService.listActivosYCerrados();
  }

  // --- Registro simple de turnos del día (mañana / tarde, sin empleado) ---

  @UseGuards(JwtAuthGuard)
  @Post('registro')
  crearRegistro(@Body() body: { fecha?: string; bloque: 'manana' | 'tarde' | 'noche'; notas?: string; horaDesde?: string; horaHasta?: string }) {
    return this.registroTurnoService.create({
      fecha: body.fecha,
      bloque: body.bloque,
      notas: body.notas,
      horaDesde: body.horaDesde,
      horaHasta: body.horaHasta,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('registro')
  listarRegistro(@Query('fecha') fecha: string) {
    return this.registroTurnoService.listByFecha(fecha);
  }

   @UseGuards(JwtAuthGuard)
   @Delete('registro/:id')
   eliminarRegistro(@Param('id') id: string) {
     return this.registroTurnoService.delete(Number(id));
   }
}
