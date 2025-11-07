import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { CreateEstadisticaDto } from './dto/create-estadistica.dto';
import { UpdateEstadisticaDto } from './dto/update-estadistica.dto';

@Controller('api/estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('inventario')
  getInventario() {
    return this.estadisticasService.getInventario();
  }

  @Get('productos-mas-vendidos')
  getProductosMasVendidos() {
    return this.estadisticasService.getProductosMasVendidos();
  }

  @Get('comercial')
  getComercial() {
    return this.estadisticasService.getComercial();
  }

  @Get('finanzas')
  getFinanzas() {
    return this.estadisticasService.getFinanzas();
  }
  @Get('ventas-metodo-pago')
  getVentasPorMetodoPago() {
    return this.estadisticasService.getVentasPorMetodoPago();
  }

  @Get('ventas-categoria')
  getVentasCategoria() {
    return this.estadisticasService.getVentasPorCategoria();
  }

  @Get('ventas-por-mes')
  getVentasPorMes() {
    return this.estadisticasService.getVentasPorMes();
  }

  @Get('productos-rentables')
  getProductosRentables() {
    return this.estadisticasService.getProductosRentables();
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
