import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './producto.entity';
import { Repository } from 'typeorm';

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
    const idCategoria = (data as any)?.idCategoria ?? (categoria as any)?.idCategoria;
    if (idCategoria) {
      (producto as any).categoria = { idCategoria: Number(idCategoria) } as any;
    }
    return this.productoRepo.save(producto);
  }

  findAll(): Promise<Producto[]> {
    return this.productoRepo.find({ relations: ['categoria'] });
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.productoRepo.findOneBy({ id: id });
    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return producto;
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
    
    producto.stockProducto = nuevaCantidad;
    return this.productoRepo.save(producto);
  }
}
