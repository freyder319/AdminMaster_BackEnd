import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe, UseGuards, Req } from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import type { Response, Request } from 'express';
import { Res } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { TurnoActivoGuard } from '../turno/turno-activo.guard';
import { TurnoLogService } from '../turno/turno-log.service';
import { TurnoService } from '../turno/turno.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('venta')
export class VentaController {
  constructor(
    private readonly service: VentaService,
    private readonly turnoLog: TurnoLogService,
    private readonly turnoService: TurnoService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, TurnoActivoGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Req() req: Request, @Body() dto: CreateVentaDto) {
    const user = (req as any)?.user || {};
    const uidRaw = (user as any).userId ?? (user as any).id;
    const uid = Number(uidRaw);
    const tieneUid = Number.isFinite(uid) && uid > 0;
    const turno = tieneUid ? await this.turnoService.getTurnoActivo(uid) : null;
    const created = await this.service.create(dto, { usuarioId: tieneUid ? uid : null, turnoId: turno?.id || null });
    await this.turnoLog.logActividad(Number(uid), 'venta_create', created.id, { total: dto.total, forma_pago: dto.forma_pago, items: (dto.items || []).length });
    return created;
  }

  @Get()
  async list(
    @Req() req: Request,
    @Query('forma_pago') forma_pago?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({ forma_pago, from, to, limit: limit ? Number(limit) : undefined });
  }

  @Get('report')
  async report(
    @Res() res: Response,
    @Query('forma_pago') forma_pago?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const rows = await this.service.findAll({ forma_pago, from, to });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Ventas');

    // Header
    ws.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Fecha y Hora', key: 'fecha_hora', width: 22 },
      { header: 'Forma de Pago', key: 'forma_pago', width: 18 },
      { header: 'Total', key: 'total', width: 14 },
      { header: 'Items', key: 'items_count', width: 10 },
    ];
    // Header styles
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.alignment = { vertical: 'middle', horizontal: 'center' };
    header.height = 18;
    header.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D6EFD' }, // azul bootstrap
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });
    // Sin AutoFilter; solo vista con cabecera congelada
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    let totalGeneral = 0;
    for (const v of rows) {
      const itemsCount = Array.isArray(v.items) ? v.items.length : 0;
      totalGeneral += Number(v.total) || 0;
      const fecha = v.fecha_hora ? new Date(v.fecha_hora) : undefined;
      const dataRow = ws.addRow({
        id: v.id,
        fecha_hora: fecha ?? '',
        forma_pago: v.forma_pago,
        total: Number(v.total) || 0,
        items_count: itemsCount,
      });
      // row borders
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEFEFEF' } },
          left: { style: 'thin', color: { argb: 'FFEFEFEF' } },
          bottom: { style: 'thin', color: { argb: 'FFEFEFEF' } },
          right: { style: 'thin', color: { argb: 'FFEFEFEF' } },
        };
      });
    }

    // Totals row
    const totalRow = ws.addRow({ forma_pago: 'TOTAL', total: totalGeneral });
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // Formats
    ws.getColumn('total').numFmt = '#,##0.00';
    ws.getColumn('fecha_hora').numFmt = 'dd/mm/yyyy hh:mm';

    // Autosize columns by max length (guard against undefined columns)
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
      col.width = Math.min(Math.max(max + 2, 10), 40);
    });

    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const fileName = `reporte_ventas_${y}-${m}-${day}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
