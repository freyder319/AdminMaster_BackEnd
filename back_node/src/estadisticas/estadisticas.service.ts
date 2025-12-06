import { Injectable } from '@nestjs/common';
import { CreateEstadisticaDto } from './dto/create-estadistica.dto';
import { UpdateEstadisticaDto } from './dto/update-estadistica.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from 'src/producto/producto.entity';
import { Repository } from 'typeorm';
import { VentaItem } from 'src/venta/venta-item.entity';
import { Venta } from 'src/venta/venta.entity';
import { GastoEntity } from 'src/gasto/gasto.entity';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(Producto)
    private productoRepo: Repository<Producto>,

    @InjectRepository(VentaItem)
    private ventaItemRepo: Repository<VentaItem>,

    @InjectRepository(Venta)
    private ventaRepo: Repository<Venta>,

    @InjectRepository(GastoEntity)
    private gastoRepo: Repository<GastoEntity>,
  ) {}

  private applyFechaRango(qb: any, columna: string, fechaDesde?: string, fechaHasta?: string) {
    if (fechaDesde) {
      qb.andWhere(`${columna} >= :fechaDesde`, { fechaDesde });
    }
    if (fechaHasta) {
      qb.andWhere(`${columna} <= :fechaHasta`, { fechaHasta });
    }
  }

  private applyPeriodoFiltro(qb: any, mes?: string, semana?: string) {
    if (mes) {
      qb.andWhere("EXTRACT(MONTH FROM venta.fecha_hora) = :mes", { mes: Number(mes) });
    }
    if (semana) {
      // Semana del mes: 1-5 aprox, usando el día del mes
      qb.andWhere("FLOOR((EXTRACT(DAY FROM venta.fecha_hora) - 1) / 7) + 1 = :semana", { semana: Number(semana) });
    }
  }

  async getInventario(_periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
 const productos = await this.productoRepo.find({
    relations: ['categoria'],
  });

  // Obtener total vendido por producto
  const ventasQb = this.ventaItemRepo
    .createQueryBuilder('item')
    .leftJoin('item.producto', 'producto')
    .leftJoin('item.venta', 'venta')
    .select('producto.id', 'productoId')
    .addSelect('SUM(item.cantidad)', 'vendidos')
    .groupBy('producto.id');

  this.applyPeriodoFiltro(ventasQb, mes, semana);
  this.applyFechaRango(ventasQb, 'venta.fecha_hora', fechaDesde, fechaHasta);

  const ventasPorProducto = await ventasQb.getRawMany();

  // Convertimos en diccionario para buscar rápido
  const ventasMap: Record<string, number> = {};
  ventasPorProducto.forEach(v => {
    ventasMap[v.productoId] = Number(v.vendidos);
  });

  return {
    labels: productos.map(p => p.nombreProducto),
    stock: productos.map(p => p.stockProducto),
    precioComercial: productos.map(p => Number(p.precioComercial)),
    precioUnitario: productos.map(p => Number(p.precioUnitario)),
    categorias: productos.map(p => p.categoria?.nombreCategoria || 'Sin categoría'),
    vendidos: productos.map(p => ventasMap[p.id] ?? 0)
  };
  }

// Estadísticas de Ventas
  async getComercial(_periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
    const qb = this.ventaRepo
      .createQueryBuilder('venta')
      .select("DATE_TRUNC('month', venta.fecha_hora)", 'mes')
      .addSelect('SUM(venta.total)', 'total')
      .groupBy("DATE_TRUNC('month', venta.fecha_hora)")
      .orderBy('mes', 'ASC');

    this.applyPeriodoFiltro(qb, mes, semana);
  this.applyFechaRango(qb, 'venta.fecha_hora', fechaDesde, fechaHasta);
    this.applyFechaRango(qb, 'venta.fecha_hora', fechaDesde, fechaHasta);

    const ventas = await qb.getRawMany();

    return {
      labels: ventas.map(v => new Date(v.mes).toLocaleString('es-ES', { month: 'long' })),
      data: ventas.map(v => Number(v.total)),
    };
  }

  // Estadísticas Financieras
async getFinanzas(_periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
   // INGRESOS (VENTAS)
  const ventasQb = this.ventaRepo
    .createQueryBuilder('venta')
    .select("TO_CHAR(venta.fecha_hora, 'Month')", 'mes')
    .addSelect('SUM(venta.total)', 'total')
    .groupBy("TO_CHAR(venta.fecha_hora, 'Month')")
    .orderBy("MIN(venta.fecha_hora)");

  this.applyPeriodoFiltro(ventasQb, mes, semana);
  this.applyFechaRango(ventasQb, 'venta.fecha_hora', fechaDesde, fechaHasta);

  const ventas = await ventasQb.getRawMany();

  // GASTOS ADMINISTRATIVOS REALES
  const gastosAdminQb = this.gastoRepo
    .createQueryBuilder('gasto')
    .select("TO_CHAR(gasto.fecha, 'Month')", 'mes')
    .addSelect('SUM(CAST(gasto.monto AS numeric))', 'total')
    .where("gasto.estado = 'confirmado'")
    .groupBy("TO_CHAR(gasto.fecha, 'Month')")
    .orderBy("MIN(gasto.fecha)");

  if (mes) {
    gastosAdminQb.andWhere("EXTRACT(MONTH FROM gasto.fecha) = :mes", { mes: Number(mes) });
  }
  if (semana) {
    gastosAdminQb.andWhere("FLOOR((EXTRACT(DAY FROM gasto.fecha) - 1) / 7) + 1 = :semana", { semana: Number(semana) });
  }
  this.applyFechaRango(gastosAdminQb, 'gasto.fecha', fechaDesde, fechaHasta);

  const gastosAdmin = await gastosAdminQb.getRawMany();

  const mesesSet = new Set([
    ...ventas.map(v => v.mes.trim()),
    ...gastosAdmin.map(g => g.mes.trim())
  ]);

  const meses = Array.from(mesesSet);

  const ingresos = meses.map(m => {
    const v = ventas.find(x => x.mes.trim() === m);
    return v ? Number(v.total) : 0;
  });

  const gastos = meses.map(m => {
    const g = gastosAdmin.find(x => x.mes.trim() === m);
    return g ? Number(g.total) : 0;
  });

  // Margen de beneficio (%)
  const margenBeneficio = ingresos.map((ing, i) => {
    const g = gastos[i] ?? 0;
    const beneficio = ing - g;
    return ing > 0 ? (beneficio / ing) * 100 : 0;
  });

  // Ganancias mensuales reales
  const ganancias = ingresos.map((ing, i) => ing - (gastos[i] ?? 0));

  // Distribución de gastos por producto vendido
  const distribucion = await this.ventaItemRepo
    .createQueryBuilder('item')
    .leftJoin('item.producto', 'producto')
    .select('producto.nombreProducto', 'nombre')
    .addSelect('SUM(item.cantidad * producto.precioUnitario)', 'costo')
    .groupBy('producto.nombreProducto')
    .orderBy('costo', 'DESC')
    .getRawMany();

  // Ticket promedio
  const totalVentasRaw = await this.ventaRepo.sum('total');
  const cantidadVentas = await this.ventaRepo.count();
  const ticketPromedio = cantidadVentas > 0 ? Number(totalVentasRaw) / cantidadVentas : 0;

  // Productos más rentables
  const productosRentables = await this.ventaItemRepo
    .createQueryBuilder('item')
    .leftJoin('item.producto', 'producto')
    .select('producto.nombreProducto', 'nombre')
    .addSelect('SUM(item.cantidad * (producto.precioComercial - producto.precioUnitario))', 'ganancia')
    .groupBy('producto.nombreProducto')
    .orderBy('ganancia', 'DESC')
    .limit(5)
    .getRawMany();

  return {
    ingresosGastos: {
      labels: meses,
      ingresos,
      gastos
    },
    margenBeneficio: {
      labels: meses,
      values: margenBeneficio
    },
    gananciasMensuales: {
      labels: meses,
      values: ganancias
    },
    distribucionGastos: {
      labels: distribucion.map(d => d.nombre),
      values: distribucion.map(d => Number(d.costo))
    },
    ticketPromedio,
    productosRentables: {
      labels: productosRentables.map(p => p.nombre),
      values: productosRentables.map(p => Number(p.ganancia))
    }
  };
}
  // Productos más vendidos
async getProductosMasVendidos(_periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
  const qb = this.ventaItemRepo
    .createQueryBuilder('item')
    .leftJoin('item.producto', 'producto')
    .leftJoin('item.venta', 'venta')
    .select('producto.nombreProducto', 'nombre')
    .addSelect('SUM(item.cantidad)', 'vendidos')
    .groupBy('producto.nombreProducto')
    .orderBy('vendidos', 'DESC')
    .limit(5);

  this.applyPeriodoFiltro(qb, mes, semana);
  this.applyFechaRango(qb, 'venta.fecha_hora', fechaDesde, fechaHasta);

  const resultados = await qb.getRawMany();

  return resultados.map(r => ({
    nombre: r.nombre,
    vendidos: Number(r.vendidos),
  }));
  }
  // Ventas por método de pago
async getVentasPorMetodoPago(_periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
  const qb = this.ventaRepo
    .createQueryBuilder('venta')
    .select('venta.forma_pago', 'metodo')
    .addSelect('COUNT(*)', 'cantidad')
    .groupBy('venta.forma_pago');

  this.applyPeriodoFiltro(qb, mes, semana);
  this.applyFechaRango(qb, 'venta.fecha_hora', fechaDesde, fechaHasta);

  const ventas = await qb.getRawMany();

  return {
    labels: ventas.map(v => v.metodo ?? 'Desconocido'),
    values: ventas.map(v => Number(v.cantidad))
  };
}


// Ventas por categoría de producto
async getVentasPorCategoria(_periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
  const qb = this.ventaItemRepo
    .createQueryBuilder('item')
    .leftJoin('item.producto', 'producto')
    .leftJoin('item.venta', 'venta')
    .leftJoin('producto.categoria', 'categoria')
    .select('categoria.nombreCategoria', 'categoria')
    .addSelect('SUM(item.cantidad)', 'cantidad')
    .groupBy('categoria.nombreCategoria');

  this.applyPeriodoFiltro(qb, mes, semana);
  this.applyFechaRango(qb, 'venta.fecha_hora', fechaDesde, fechaHasta);

  const resultados = await qb.getRawMany();

  return {
    labels: resultados.map(r => r.categoria || 'Sin categoría'),
    values: resultados.map(r => Number(r.cantidad))
  };
}


// Cantidad de ventas por mes
async getVentasPorMes(_periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
  const qb = await this.ventaRepo
      .createQueryBuilder('venta')
      .select("TO_CHAR(venta.fecha_hora, 'Month')", 'mes')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy("TO_CHAR(venta.fecha_hora, 'Month')")
      .orderBy("MIN(venta.fecha_hora)");

    this.applyPeriodoFiltro(qb, mes, semana);
    this.applyFechaRango(qb, 'venta.fecha_hora', fechaDesde, fechaHasta);

    const ventas = await qb.getRawMany();

    return {
      labels: ventas.map(v => v.mes.trim()),
      values: ventas.map(v => Number(v.cantidad)),
    };
}


// Productos más rentables
async getProductosRentables(_periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
  const qb = this.ventaItemRepo
    .createQueryBuilder('item')
    .leftJoin('item.producto', 'producto')
    .leftJoin('item.venta', 'venta')
    .select('producto.nombreProducto', 'nombre')
    .addSelect('SUM(item.cantidad)', 'vendidos')
    .addSelect('producto.precioComercial', 'precio')
    .addSelect('producto.precioUnitario', 'costo')
    .groupBy('producto.nombreProducto')
    .addGroupBy('producto.precioComercial')
    .addGroupBy('producto.precioUnitario')
    .orderBy('vendidos', 'DESC');

  this.applyPeriodoFiltro(qb, mes, semana);
  this.applyFechaRango(qb, 'venta.fecha_hora', fechaDesde, fechaHasta);

  const resultados = await qb.getRawMany();

  return {
    labels: resultados.map(r => r.nombre),
    values: resultados.map(r => (Number(r.precio) - Number(r.costo)) * Number(r.vendidos))
  };
  }
  async getIngresosVsGastos() {
  const ingresos = await this.ventaRepo
    .createQueryBuilder('venta')
    .select("DATE_TRUNC('month', venta.fecha_hora)", 'mes')
    .addSelect('SUM(venta.total)', 'ingresos')
    .groupBy("DATE_TRUNC('month', venta.fecha_hora)")
    .orderBy('mes', 'ASC')
    .getRawMany();

  const gastos = await this.ventaItemRepo
    .createQueryBuilder('item')
    .leftJoin('item.producto', 'producto')
    .leftJoin('item.venta', 'venta')
    .select("DATE_TRUNC('month', venta.fecha_hora)", 'mes')
    .addSelect('SUM(item.cantidad * producto.precioUnitario)', 'gasto')
    .groupBy("DATE_TRUNC('month', venta.fecha_hora)")
    .orderBy('mes', 'ASC')
    .getRawMany();

  return {
    labels: ingresos.map(i => new Date(i.mes).toLocaleString('es-ES', { month: 'long' })),
    ingresos: ingresos.map(i => Number(i.ingresos)),
    gastos: gastos.map(g => Number(g.gasto))
  };
  }
  async getMargenBeneficioMensual() {
  const ingresosVsGastos = await this.getIngresosVsGastos();

  const margen = ingresosVsGastos.ingresos.map((ing, i) => {
    const g = ingresosVsGastos.gastos[i] ?? 0;
    const beneficio = ing - g;
    return beneficio > 0 ? (beneficio / ing) * 100 : 0;
  });

  return {
    labels: ingresosVsGastos.labels,
    margen
  };
  }
  async getGananciasMensuales() {
  const ingresosVsGastos = await this.getIngresosVsGastos();

  const ganancias = ingresosVsGastos.ingresos.map((ing, i) => {
    const g = ingresosVsGastos.gastos[i] ?? 0;
    return ing - g;
  });

  return {
    labels: ingresosVsGastos.labels,
    ganancias
  };
  }
  async getDistribucionGastos() {
  const gastos = await this.ventaItemRepo
    .createQueryBuilder('item')
    .leftJoin('item.producto', 'producto')
    .select('producto.nombreProducto', 'nombre')
    .addSelect('SUM(item.cantidad * producto.precioUnitario)', 'costo')
    .groupBy('producto.nombreProducto')
    .orderBy('costo', 'DESC')
    .getRawMany();

  return gastos.map(g => ({
    nombre: g.nombre,
    costo: Number(g.costo)
  }));
  }
  async getTicketPromedio() {
  const totalVentasRaw = await this.ventaRepo.sum('total');
  const cantidadVentas = await this.ventaRepo.count();

  const promedio = cantidadVentas > 0 ? Number(totalVentasRaw) / Number(cantidadVentas) : 0;

  return {
    totalVentas: Number(totalVentasRaw),
    cantidadVentas,
    ticketPromedio: promedio
  };
  }
  async getProductosMasRentables() {
  const productos = await this.ventaItemRepo
    .createQueryBuilder('item')
    .leftJoin('item.producto', 'producto')
    .select('producto.nombreProducto', 'nombre')
    .addSelect('SUM(item.cantidad * (producto.precioComercial - producto.precioUnitario))', 'ganancia')
    .groupBy('producto.nombreProducto')
    .orderBy('ganancia', 'DESC')
    .limit(5)
    .getRawMany();

  return productos.map(r => ({
    nombre: r.nombre,
    ganancia: Number(r.ganancia)
  }));
  }
}
