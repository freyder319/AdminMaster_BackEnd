import { Entity,Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn} from 'typeorm';
@Entity('cliente')
export class ClienteEntity {
    @PrimaryGeneratedColumn()
    id!: number;
    @Column({type:'varchar', length:50})
    nombre!:string;
    @Column({type:'varchar', length:50})
    apellido!:string;
    @Column({type:'varchar',length:10})
    numero!:string;
    @Column ({type:'varchar', length:50, unique:  true})
    correo!:string;
    @Column ({type:'varchar',length:20})
    estado!:string;
    @CreateDateColumn()
    creadoEn!: Date;
    @UpdateDateColumn()
    actualizadoEn!: Date;
}