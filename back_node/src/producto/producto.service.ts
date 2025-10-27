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
    const productoExistente = await this.productoRepo.findOne({
      where: { codigoProducto: data.codigoProducto },
    });
    if (productoExistente?.codigoProducto !== producto.codigoProducto) {
      throw new BadRequestException('Codigo de Producto ya Existente');
    }
    const updateData: any = { ...data };
    const idCategoria = (data as any)?.idCategoria ?? (data as any)?.categoria?.idCategoria;
    if (idCategoria) {
      updateData.categoria = { idCategoria: Number(idCategoria) } as any;
      delete updateData.idCategoria;
    }
    await this.productoRepo.update(id, updateData);
    return producto;
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.productoRepo.delete(id);
    return { deleted: true };
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
}
