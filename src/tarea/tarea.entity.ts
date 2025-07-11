import { Indicador } from 'src/indicador/indicador.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Tarea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text',  nullable: true })
  descripcion: string;

  @Column({ type: 'date', nullable: true })
  plazo: Date;

  @Column({ type: 'date', nullable: true })
  cumplimiento?: Date; // Cambiado de string a fecha

  @Column({ nullable: true })
  evidencias?: string; // Nombre del archivo PDF guardado

  @Column({ nullable: true })
  obs?: string;

  @ManyToOne(() => Indicador, indicador => indicador.tareas, { onDelete: 'CASCADE' })
  indicador: Indicador;
}
