import { Controller, Get, Query } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { CreateEstadisticaDto } from './dto/create-estadistica.dto';
import { UpdateEstadisticaDto } from './dto/update-estadistica.dto';

@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('inventario')
  getInventario(
    @Query('periodo') periodo?: string,
    @Query('mes') mes?: string,
    @Query('semana') semana?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.estadisticasService.getInventario(periodo, mes, semana, fechaDesde, fechaHasta);
  }

  @Get('productos-mas-vendidos')
  getProductosMasVendidos(
    @Query('periodo') periodo?: string,
    @Query('mes') mes?: string,
    @Query('semana') semana?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.estadisticasService.getProductosMasVendidos(periodo, mes, semana, fechaDesde, fechaHasta);
  }

  @Get('comercial')
  getComercial(
    @Query('periodo') periodo?: string,
    @Query('mes') mes?: string,
    @Query('semana') semana?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.estadisticasService.getComercial(periodo, mes, semana, fechaDesde, fechaHasta);
  }

  @Get('finanzas')
  getFinanzas(
    @Query('periodo') periodo?: string,
    @Query('mes') mes?: string,
    @Query('semana') semana?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.estadisticasService.getFinanzas(periodo, mes, semana, fechaDesde, fechaHasta);
  }
  @Get('ventas-metodo-pago')
  getVentasPorMetodoPago(
    @Query('periodo') periodo?: string,
    @Query('mes') mes?: string,
    @Query('semana') semana?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.estadisticasService.getVentasPorMetodoPago(periodo, mes, semana, fechaDesde, fechaHasta);
  }

  @Get('ventas-categoria')
  getVentasCategoria(
    @Query('periodo') periodo?: string,
    @Query('mes') mes?: string,
    @Query('semana') semana?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.estadisticasService.getVentasPorCategoria(periodo, mes, semana, fechaDesde, fechaHasta);
  }

  @Get('ventas-por-mes')
  getVentasPorMes(
    @Query('periodo') periodo?: string,
    @Query('mes') mes?: string,
    @Query('semana') semana?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.estadisticasService.getVentasPorMes(periodo, mes, semana, fechaDesde, fechaHasta);
  }

  @Get('productos-rentables')
  getProductosRentables(
    @Query('periodo') periodo?: string,
    @Query('mes') mes?: string,
    @Query('semana') semana?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.estadisticasService.getProductosRentables(periodo, mes, semana, fechaDesde, fechaHasta);
  }
  @Get('finanzas/ingresos-gastos')
  getIngresosGastos() {
    return this.estadisticasService.getIngresosVsGastos();
  }

  @Get('finanzas/margen-beneficio')
  getMargenBeneficio() {
    return this.estadisticasService.getMargenBeneficioMensual();
  }

  @Get('finanzas/ganancias-mensuales')
  getGananciasMensuales() {
    return this.estadisticasService.getGananciasMensuales();
  }

  @Get('finanzas/distribucion-gastos')
  getDistribucionGastos() {
    return this.estadisticasService.getDistribucionGastos();
  }

  @Get('finanzas/ticket-promedio')
  getTicketPromedio() {
    return this.estadisticasService.getTicketPromedio();
  }

}
