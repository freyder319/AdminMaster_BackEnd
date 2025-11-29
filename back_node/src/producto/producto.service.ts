import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './producto.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private productoRepo: Repository<Producto>,
  ) {}
  async create(data: Partial<Producto>): Promise<Producto> {
    const productoExistente = await this.productoRepo.findOne({
      where: { codigoProducto: data.codigoProducto },
    });
    if (productoExistente) {
      throw new BadRequestException('Codigo de Producto ya Existente');
    }
    // Mapear idCategoria (si viene) a la relación categoria
    const { categoria, ...rest } = data as any;
    const producto = this.productoRepo.create(rest as Partial<Producto>);
    // Ajustar estado según stock inicial si viene especificado
    if (typeof (producto as any).stockProducto === 'number') {
      (producto as any).estado = ((producto as any).stockProducto ?? 0) > 0;
    }
    const idCategoria = (data as any)?.idCategoria ?? (categoria as any)?.idCategoria;
    if (idCategoria) {
      (producto as any).categoria = { idCategoria: Number(idCategoria) } as any;
    }
    return this.productoRepo.save(producto);
  }

  findAll(includeAll = false): Promise<Producto[]> {
    if (includeAll) {
      return this.productoRepo.find({ relations: ['categoria'], order: { estado: 'DESC' as any, id: 'ASC' as any } });
    }
    return this.productoRepo.find({ where: { estado: true } as any, relations: ['categoria'], order: { id: 'ASC' as any } });
  }
findPublic(): Promise<Producto[]> {
  return this.productoRepo.find({
    where: { estado: true },
    relations: {
      categoria: true    // Cargar SOLO la categoría
    },
    order: { id: 'ASC' }
  });
}
  async findPaged(options: {
    page?: number;
    size?: number;
    sort?: 'id' | 'nombreProducto' | 'precioUnitario' | 'estado';
    order?: 'ASC' | 'DESC';
    q?: string;
    categoryId?: number | '';
    includeAll?: boolean;
  }): Promise<{ data: Producto[]; total: number; page: number; size: number }> {
    const page = Math.max(1, Number(options.page || 1));
    const size = Math.min(100, Math.max(1, Number(options.size || 15)));
    const qb = this.productoRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c');
    const includeAll = !!options.includeAll;
    if (!includeAll) {
      qb.andWhere('p.estado = :estado', { estado: true });
    }
    if (options.categoryId !== '' && options.categoryId != null) {
      qb.andWhere('(c."idCategoria" = :cid OR p."idCategoria" = :cid)', { cid: Number(options.categoryId) });
    }
    const q = String(options.q || '').trim().toLowerCase();
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      for (let i = 0; i < tokens.length; i++) {
        const t = `%${tokens[i]}%`;
        qb.andWhere('(LOWER(p."nombreProducto") LIKE :t' + i + ' OR LOWER(p."codigoProducto") LIKE :t' + i + ' OR LOWER(c."nombreCategoria") LIKE :t' + i + ')', { ['t' + i]: t });
      }
    }
    const sort = (options.sort || 'id');
    const order: 'ASC' | 'DESC' = (String(options.order || 'ASC').toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
    const sortMap: Record<string, string> = {
      id: 'p.id',
      nombreProducto: 'p."nombreProducto"',
      precioUnitario: 'p."precioUnitario"',
      estado: 'p."estado"'
    };
    qb.orderBy(sortMap[sort] || 'p.id', order as any)
      .skip((page - 1) * size)
      .take(size);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, size };
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.productoRepo.findOneBy({ id: id });
    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return producto;
  }

  async canDelete(id: number): Promise<{ canDelete: boolean }> {
    // Try a test delete inside a transaction and roll it back to detect FK constraints
    const runner = this.productoRepo.manager.connection.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const res = await runner.manager.delete(Producto, id);
      // If it reached here without FK error, consider deletable
      await runner.rollbackTransaction();
      return { canDelete: !!res.affected };
    } catch (e: any) {
      const code = e?.code || e?.driverError?.code;
      await runner.rollbackTransaction();
      if (code === '23503') {
        return { canDelete: false };
      }
      // Unknown error: treat as not deletable to be safe
      return { canDelete: false };
    } finally {
      await runner.release();
    }
  }

  async setEstado(id: number, estado: boolean): Promise<Producto> {
    const prod = await this.productoRepo.findOne({ where: { id } });
    if (!prod) throw new NotFoundException(`Producto con id ${id} no encontrado`);
    await this.productoRepo.update(id, { estado } as any);
    const actualizado = await this.productoRepo.findOne({ where: { id }, relations: ['categoria'] });
    if (!actualizado) throw new NotFoundException(`Producto con id ${id} no encontrado`);
    return actualizado;
  }

  async update(id: number, data: Partial<Producto>): Promise<Producto> {
    const producto = await this.productoRepo.findOneBy({ id: id });
    if (!producto) {
      throw new Error(`Producto con id ${id} no encontrado`);
    }
    // Validar código duplicado solo si se intenta cambiar el código
    if (data.codigoProducto && data.codigoProducto !== producto.codigoProducto) {
      const productoExistente = await this.productoRepo.findOne({
        where: { codigoProducto: data.codigoProducto },
      });
      if (productoExistente && productoExistente.id !== producto.id) {
        throw new BadRequestException('Codigo de Producto ya Existente');
      }
    }
    const updateData: any = { ...data };
    // Si viene el stock en el payload, auto-ajustar estado
    if (Object.prototype.hasOwnProperty.call(updateData, 'stockProducto')) {
      const st = Number(updateData.stockProducto);
      if (Number.isFinite(st)) {
        updateData.estado = st > 0;
      }
    }
    const idCategoria = (data as any)?.idCategoria ?? (data as any)?.categoria?.idCategoria;
    if (idCategoria) {
      updateData.categoria = { idCategoria: Number(idCategoria) } as any;
      delete updateData.idCategoria;
    }
    await this.productoRepo.update(id, updateData);
    // Retornar el producto actualizado (opcionalmente con relaciones)
    const actualizado = await this.productoRepo.findOne({ where: { id }, relations: ['categoria'] });
    if (!actualizado) throw new NotFoundException(`Producto con id ${id} no encontrado`);
    return actualizado;
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    try {
      const res = await this.productoRepo.delete(id);
      if (!res.affected) {
        throw new NotFoundException(`Producto con id ${id} no encontrado`);
      }
      return { deleted: true };
    } catch (e: any) {
      const code = e?.code || e?.driverError?.code;
      // Postgres foreign key violation
      if (code === '23503') {
        throw new BadRequestException('No se puede eliminar: el producto está enlazado a una venta u otros registros.');
      }
      throw e;
    }
  }
  async countProductos(): Promise<number> {
    const total = await this.productoRepo.count();
    if (total == null) {
      return 0;
    }
    return total;
  }
  async getTotalMoney(): Promise<{ total: number }> {
    const result = await this.productoRepo
      .createQueryBuilder('producto')
      .select('SUM(producto."stockProducto" * producto."precioUnitario")', 'total')
      .getRawOne();
    return { total: Number(result.total) || 0 };
  }
  async buscarPorCodigo(codigo: string): Promise<Producto | null> {
    return this.productoRepo.findOne({ 
      where: { codigoProducto: codigo },
      relations: ['categoria']
    });
  }

  async actualizarStock(id: number, nuevaCantidad: number): Promise<Producto> {
    const producto = await this.productoRepo.findOne({ where: { id } });
    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    
    const cantidad = Number(nuevaCantidad);
    if (!Number.isFinite(cantidad) || cantidad < 0 || cantidad > 500) {
      throw new BadRequestException('El stock debe estar entre 0 y 500 unidades.');
    }

    producto.stockProducto = cantidad;
    return this.productoRepo.save(producto);
  }

  /**
   * Procesa una imagen de producto en base64, elimina el fondo con el mismo
   * servicio externo usado para el logo, guarda el PNG en storage/productos
   * y devuelve la URL pública para usarla como imgProducto.
   */
  async processImagenBase64(imageBase64: string): Promise<{ imgProducto: string }> {
    if (!imageBase64) {
      throw new BadRequestException('imageBase64 es requerido');
    }

    const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const apiKey = process.env.REMOVEBG_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Falta configurar REMOVEBG_API_KEY en el backend');
    }

    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: {
        image_file_b64: base64Clean,
        size: 'auto',
      },
      headers: {
        'X-Api-Key': apiKey,
      },
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      throw new BadRequestException('No se pudo procesar la imagen del producto en el servicio de eliminación de fondo');
    }

    const storageDir = join(__dirname, '..', '..', 'storage', 'productos');
    await fs.mkdir(storageDir, { recursive: true });
    const fileName = `producto_${Date.now()}.png`;
    const filePath = join(storageDir, fileName);
    await fs.writeFile(filePath, response.data);

    const baseUrl = process.env.PUBLIC_BASE_URL ?? 'https://antojitosdoima.site/api';
    const imgProducto = `${baseUrl}/storage/productos/${fileName}`;

    return { imgProducto };
  }
}
