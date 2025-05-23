import { Indicador } from "src/indicador/indicador.entity";
import { Tarea } from "src/tarea/tarea.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LineaTrabajo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;

  @OneToMany(() => Indicador, indicador => indicador.lineaTrabajo)
  indicadores: Indicador[];
}
