// src/establecimiento/establecimiento.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { Convenio } from 'src/convenio/convenio.entity';

@Entity()
export class Establecimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;
  
  @OneToMany(() => Usuario, usuario => usuario.establecimiento)
  usuarios: Usuario[];

  @OneToMany(() => Convenio, convenio => convenio.establecimiento)
  convenios: Convenio[];
}
