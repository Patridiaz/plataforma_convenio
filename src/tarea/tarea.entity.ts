import { Indicador } from "src/indicador/indicador.entity";
import { LineaTrabajo } from "src/linea-trabajo/linea-trabajo.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

// src/tarea/tarea.entity.ts
@Entity()
export class Tarea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'date' })
  plazo: Date;

  @Column({ nullable: true })
  cumplimiento?: string;

  @Column({ nullable: true })
  evidencias?: string;

  @Column({ nullable: true })
  eval?: string;

  @Column({ nullable: true })
  obs?: string;

  @ManyToOne(() => Indicador, indicador => indicador.tareas)
  indicador: Indicador;
}

