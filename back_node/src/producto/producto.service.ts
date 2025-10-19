import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from './producto.entity';
import { Repository } from 'typeorm';
import { categoria } from 'src/categoria/categoria.entity';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private productoRepo: Repository<Producto>,
  ){}
  async create(data: Partial<Producto>):Promise<Producto> {
    // Mapear idCategoria a relación categoria si viene como número
    if ((data as any).idCategoria) {
      (data as any).categoria = { idCategoria: (data as any).idCategoria } as any;
      delete (data as any).idCategoria;
    }
    // Asignar imagen por defecto si no viene
    if (!data.imgProducto || (typeof data.imgProducto === 'string' && data.imgProducto.trim() === '')) {
      data.imgProducto = 'default.jpg';
    }
    const productoExistente = await this.productoRepo.findOne({
      where: {codigoProducto:data.codigoProducto},
    })
    if(productoExistente){
      throw new BadRequestException('Codigo de Producto ya Existente');
    }
    const producto= await this.productoRepo.create(data);
    return this.productoRepo.save(producto);
  }

  findAll(): Promise<Producto[]> {
    return this.productoRepo.find({ relations: ['categoria'] });
  }

  async findOne(id: number): Promise<Producto> {
    const  producto = await this.productoRepo.findOne({ where: { id }, relations: ['categoria'] })
    if(!producto){
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return producto;
  }

  async update(id: number, data: Partial<Producto>): Promise<Producto> {
    // Mapear idCategoria a relación categoria si viene como número
    if ((data as any).idCategoria) {
      (data as any).categoria = { idCategoria: (data as any).idCategoria } as any;
      delete (data as any).idCategoria;
    }
    const producto = await this.productoRepo.findOne({ where: { id } });
    if(!producto){
      throw new Error (`Producto con id ${id} no encontrado`);
    }
    const productoExistente = await this.productoRepo.findOne({
      where: {codigoProducto:data.codigoProducto},
    })
    if(productoExistente?.codigoProducto!==producto.codigoProducto){
      throw new BadRequestException('Codigo de Producto ya Existente');
    }
    // Si el cliente envía vacío o null para imagen, usar default
    if (data.hasOwnProperty('imgProducto')) {
      const val: any = (data as any).imgProducto;
      if (!val || (typeof val === 'string' && val.trim() === '')) {
        data.imgProducto = 'default.jpg';
      }
    }
    // Usar save para manejar relaciones correctamente
    const actualizado = await this.productoRepo.save({ id, ...data });
    return actualizado;
  }

  async remove(id: number):Promise<{deleted:boolean}> {
    await this.productoRepo.delete(id);
    return{deleted:true}
  }
  async countProductos():Promise<number>{
    const total= await this.productoRepo.count();
    if(total==null){
      total==0;
    }
    return total;
  }
  async getTotalMoney():Promise<{total:number}>{
    const result = await this.productoRepo
    .createQueryBuilder('producto')
    .select('SUM(producto."stockProducto" * producto."precioUnitario")', 'total')
    .getRawOne();
    return{ total:Number(result.total)||0};
  }
}
