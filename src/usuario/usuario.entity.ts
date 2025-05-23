// src/usuario/usuario.entity.ts
import { Convenio } from 'src/convenio/convenio.entity';
import { Establecimiento } from 'src/establecimiento/establecimiento.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'director' }) // director | sostenedor | admin
  rol: string;

  @OneToMany(() => Convenio, (convenio) => convenio.creadoPor)
  convenios: Convenio[];
  
  @ManyToOne(() => Establecimiento)
  @JoinColumn({ name: 'establecimientoId' })
  establecimiento: Establecimiento;

  @Column()
  establecimientoId: number;

}
