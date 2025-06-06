// src/entities/dimension.entity.ts
import { Convenio } from 'src/convenio/convenio.entity';
import { Indicador } from 'src/indicador/indicador.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class Dimension {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column('float')
  ponderacion: number;

  @ManyToOne(() => Convenio, convenio => convenio.dimensiones, { onDelete: 'CASCADE' })
  convenio: Convenio;

  @OneToMany(() => Indicador, indicador => indicador.dimension, { cascade: true, eager: true })
  indicadores: Indicador[];
}
