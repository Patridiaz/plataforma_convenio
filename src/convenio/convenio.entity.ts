// src/convenio/convenio.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { Establecimiento } from 'src/establecimiento/establecimiento.entity';
import { Indicador } from 'src/indicador/indicador.entity';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateIndicadorDto } from 'src/indicador/dto/create-indicador.dto';

@Entity()
export class Convenio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Usuario, (usuario) => usuario.convenios)
  creadoPor: Usuario;

  @ManyToOne(() => Establecimiento, est => est.convenios)
  establecimiento: Establecimiento;
  
  @OneToMany(() => Indicador, indicador => indicador.convenio, { cascade: true })
  indicadores: Indicador[];
}
