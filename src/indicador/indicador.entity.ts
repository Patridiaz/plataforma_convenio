// src/convenio/convenio.entity.ts
import { Convenio } from 'src/convenio/convenio.entity';
import { Dimension } from 'src/dimension/dimension.entity';
import { LineaTrabajo } from 'src/linea-trabajo/linea-trabajo.entity';
import { Tarea } from 'src/tarea/tarea.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';


@Entity()
export class Indicador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true  })
  descripcion?: string;

  @Column({ type: 'text',  nullable: true })
  consideraciones: string;
  
  @Column({ type: 'float', nullable: true })
  meta?: number;

  @Column({ type: 'float', nullable: true })
  evaluacion?: number;

  @ManyToOne(() => LineaTrabajo, (lineaTrabajo) => lineaTrabajo.indicadores, { eager: true })
  lineaTrabajo: LineaTrabajo;

  @ManyToOne(() => Convenio, convenio => convenio.indicadores)
  convenio: Convenio;

  @OneToMany(() => Tarea, tarea => tarea.indicador, { cascade: true })
  tareas: Tarea[];

  @ManyToOne(() => Dimension, dimension => dimension.indicadores, { onDelete: 'CASCADE' })
  dimension: Dimension;

}

