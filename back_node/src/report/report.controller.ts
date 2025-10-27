import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { VentaService } from '../venta/venta.service';
import { GastoService } from '../gasto/gasto.service';
import { ProductoService } from '../producto/producto.service';
import { CajaService } from '../caja/caja.service';
import { ProveedorService } from '../proveedor/proveedor.service';
import { ClienteService } from '../cliente/cliente.service';
import { EmpleadoService } from '../empleado/empleado.service';

@Controller('report')
export class ReportController {
  constructor(
    private readonly ventaSrv: VentaService,
    private readonly gastoSrv: GastoService,
    private readonly productoSrv: ProductoService,
    private readonly cajaSrv: CajaService,
    private readonly proveedorSrv: ProveedorService,
    private readonly clienteSrv: ClienteService,
    private readonly empleadoSrv: EmpleadoService,
  ) {}

  @Get('general')
  async general(
    @Res() res: Response,
    @Query('tipos') tipos?: string | string[], // csv or repeated: ventas,gastos or tipos=ventas&tipos=gastos
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('forma_pago') forma_pago?: string,
  ) {
    const raw = Array.isArray(tipos) ? tipos : (tipos ? tipos.split(',') : ['ventas']);
    const tiposArr = raw.map(t => t.trim()).filter(Boolean);

    const wb = new ExcelJS.Workbook();
    // Helper para aplicar estilos modernos de forma consistente
    const applyModernStyles = (ws: ExcelJS.Worksheet) => {
      if (!ws) return;
      const header = ws.getRow(1);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.alignment = { vertical: 'middle', horizontal: 'center' } as any;
      header.height = 20;
      header.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } } as any; // azul moderno
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFBFD1E5' } },
          left: { style: 'thin', color: { argb: 'FFBFD1E5' } },
          bottom: { style: 'thin', color: { argb: 'FF5B9BD5' } },
          right: { style: 'thin', color: { argb: 'FFBFD1E5' } },
        } as any;
      });
      // Zebra y bordes suaves
      const rows = ws.rowCount;
      for (let r = 2; r <= rows; r++) {
        const row = ws.getRow(r);
        row.alignment = { vertical: 'middle' } as any;
        const zebra = r % 2 === 0;
        row.eachCell((cell) => {
          if (zebra) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FBFF' } } as any; // gris muy claro azulado
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE9EEF5' } },
            left: { style: 'thin', color: { argb: 'FFE9EEF5' } },
            bottom: { style: 'thin', color: { argb: 'FFE9EEF5' } },
            right: { style: 'thin', color: { argb: 'FFE9EEF5' } },
          } as any;
        });
      }
      // Freeze top row (sin AutoFilter)
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      // Autosize
      ws.columns?.forEach((col: any) => {
        if (!col) return;
        let max = (typeof col.width === 'number' ? col.width : 10) as number;
        if (typeof col.eachCell === 'function') {
          col.eachCell({ includeEmpty: true }, (cell: any) => {
            const val = cell?.value as any;
            const text = val instanceof Date ? val.toISOString() : (val != null ? String(val) : '');
            const len = text.length;
            if (len > max) max = len;
          });
        }
        col.width = Math.min(Math.max(max + 2, 10), 44);
      });
    };

    if (tiposArr.includes('ventas')) {
      const ventas = await this.ventaSrv.findAll({ from, to, forma_pago });
      const ws = wb.addWorksheet('Ventas');
      ws.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Fecha y Hora', key: 'fecha_hora', width: 22 },
        { header: 'Forma de Pago', key: 'forma_pago', width: 18 },
        { header: 'Total', key: 'total', width: 14 },
        { header: 'Items', key: 'items_count', width: 10 },
      ];
      const header = ws.getRow(1);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.alignment = { vertical: 'middle', horizontal: 'center' };
      header.height = 18;
      header.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
      });
      // Sin AutoFilter; solo congelar cabecera
      ws.views = [{ state: 'frozen', ySplit: 1 }];

      let totalGeneral = 0;
      for (const v of ventas) {
        const itemsCount = Array.isArray(v.items) ? v.items.length : 0;
        totalGeneral += Number(v.total) || 0;
        const fecha = v.fecha_hora ? new Date(v.fecha_hora) : undefined;
        ws.addRow({ id: v.id, fecha_hora: fecha ?? '', forma_pago: v.forma_pago, total: Number(v.total) || 0, items_count: itemsCount });
      }
      const totalRow = ws.addRow({ forma_pago: 'TOTAL', total: totalGeneral });
      totalRow.font = { bold: true };
      ws.getColumn('total').numFmt = '#,##0.00';
      ws.getColumn('fecha_hora').numFmt = 'dd/mm/yyyy hh:mm';
      applyModernStyles(ws);
    }

    if (tiposArr.includes('gastos')) {
      const gastos = await this.gastoSrv.findAll();
      const ws = wb.addWorksheet('Gastos');
      ws.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Fecha', key: 'fecha', width: 14 },
        { header: 'Nombre', key: 'nombre', width: 24 },
        { header: 'Descripción', key: 'descripcion', width: 36 },
        { header: 'Monto', key: 'monto', width: 14 },
        { header: 'Forma de Pago', key: 'forma_pago', width: 18 },
        { header: 'Estado', key: 'estado', width: 14 },
        { header: 'ProveedorId', key: 'proveedorId', width: 12 },
        { header: 'CategoriaId', key: 'categoriaId', width: 12 },
      ];
      const header = ws.getRow(1);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.alignment = { vertical: 'middle', horizontal: 'center' };
      header.height = 18;
      header.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
      });
      // Sin AutoFilter; solo congelar cabecera
      ws.views = [{ state: 'frozen', ySplit: 1 }];

      let totalGastos = 0;
      for (const g of gastos) {
        totalGastos += Number(g.monto) || 0;
        ws.addRow({
          id: g.id,
          fecha: g.fecha,
          nombre: (g as any).nombre || '',
          descripcion: g.descripcion || '',
          monto: Number(g.monto) || 0,
          forma_pago: g.forma_pago,
          estado: g.estado,
          proveedorId: g.proveedorId || '',
          categoriaId: g.categoriaId || '',
        });
      }
      const totalRow = ws.addRow({ descripcion: 'TOTAL', monto: totalGastos });
      totalRow.font = { bold: true };
      ws.getColumn('monto').numFmt = '#,##0.00';
      applyModernStyles(ws);
    }

    if (tiposArr.includes('inventario')) {
      const productos = await this.productoSrv.findAll();
      const ws = wb.addWorksheet('Inventario');
      ws.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Código', key: 'codigoProducto', width: 16 },
        { header: 'Nombre', key: 'nombreProducto', width: 28 },
        { header: 'Stock', key: 'stockProducto', width: 10 },
        { header: 'Precio Unitario', key: 'precioUnitario', width: 16 },
        { header: 'Precio Comercial', key: 'precioComercial', width: 16 },
        { header: 'Categoría', key: 'categoria', width: 18 },
      ];
      const header = ws.getRow(1); header.font = { bold: true };
      for (const p of productos) {
        ws.addRow({
          id: (p as any).id,
          codigoProducto: (p as any).codigoProducto,
          nombreProducto: (p as any).nombreProducto,
          stockProducto: (p as any).stockProducto,
          precioUnitario: Number((p as any).precioUnitario) || 0,
          precioComercial: Number((p as any).precioComercial) || 0,
          categoria: (p as any)?.categoria?.nombreCategoria || '',
        });
      }
      ws.getColumn('precioUnitario').numFmt = '#,##0';
      ws.getColumn('precioComercial').numFmt = '#,##0';
      applyModernStyles(ws);
    }

    if (tiposArr.includes('cajas')) {
      const cajas = await this.cajaSrv.findAll();
      const ws = wb.addWorksheet('Cajas');
      ws.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Código', key: 'codigoCaja', width: 16 },
        { header: 'Nombre', key: 'nombre', width: 20 },
        { header: 'Estado', key: 'estado', width: 14 },
        { header: 'Creado', key: 'creadoEn', width: 22 },
        { header: 'Actualizado', key: 'actualizadoEn', width: 22 },
      ];
      const header = ws.getRow(1); header.font = { bold: true };
      for (const c of cajas as any[]) {
        ws.addRow({
          id: c.id,
          codigoCaja: c.codigoCaja,
          nombre: c.nombre,
          estado: c.estado,
          creadoEn: c.creadoEn ? new Date(c.creadoEn) : '',
          actualizadoEn: c.actualizadoEn ? new Date(c.actualizadoEn) : '',
        });
      }
      ws.getColumn('creadoEn').numFmt = 'dd/mm/yyyy hh:mm';
      ws.getColumn('actualizadoEn').numFmt = 'dd/mm/yyyy hh:mm';
      applyModernStyles(ws);
    }

    if (tiposArr.includes('proveedores')) {
      const proveedores = await this.proveedorSrv.findAll();
      const ws = wb.addWorksheet('Proveedores');
      ws.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Nombre', key: 'nombre', width: 20 },
        { header: 'Apellido', key: 'apellido', width: 20 },
        { header: 'Telefono', key: 'telefono', width: 16 },
        { header: 'Correo', key: 'correo', width: 28 },
        { header: 'Activo', key: 'activo', width: 10 },
      ];
      const header = ws.getRow(1); header.font = { bold: true };
      for (const p of proveedores as any[]) {
        ws.addRow({ id: p.id, nombre: p.nombre, apellido: p.apellido || '', telefono: p.telefono, correo: p.correo, activo: p.activo ? 'Sí' : 'No' });
      }
      applyModernStyles(ws);
    }

    if (tiposArr.includes('clientes')) {
      const clientes = await this.clienteSrv.findAll();
      const ws = wb.addWorksheet('Clientes');
      ws.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Nombre', key: 'nombre', width: 18 },
        { header: 'Apellido', key: 'apellido', width: 18 },
        { header: 'Número', key: 'numero', width: 14 },
        { header: 'Correo', key: 'correo', width: 28 },
        { header: 'Estado', key: 'estado', width: 14 },
        { header: 'Creado', key: 'creadoEn', width: 22 },
      ];
      const header = ws.getRow(1); header.font = { bold: true };
      for (const c of clientes as any[]) {
        ws.addRow({ id: c.id, nombre: c.nombre, apellido: c.apellido, numero: c.numero, correo: c.correo, estado: c.estado, creadoEn: c.creadoEn ? new Date(c.creadoEn) : '' });
      }
      ws.getColumn('creadoEn').numFmt = 'dd/mm/yyyy hh:mm';
      applyModernStyles(ws);
    }

    if (tiposArr.includes('empleados')) {
      const empleados = await this.empleadoSrv.findAll();
      const ws = wb.addWorksheet('Empleados');
      ws.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Correo', key: 'correo', width: 28 },
        { header: 'Teléfono', key: 'telefono', width: 16 },
        { header: 'Caja', key: 'caja', width: 18 },
      ];
      const header = ws.getRow(1); header.font = { bold: true };
      for (const e of empleados as any[]) {
        ws.addRow({ id: e.id, correo: e.correo, telefono: e.telefono || '', caja: e?.caja?.nombre || '' });
      }
      applyModernStyles(ws);
    }

    // Construir nombre de archivo según selección
    const safe = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const picked = (tiposArr && tiposArr.length > 0) ? tiposArr.map(safe) : [];
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    const base = picked.length ? `reporte_${picked.join('_')}` : 'reporte';
    const fileName = `${base}_${dateStr}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await wb.xlsx.write(res);
    res.end();
  }

}
