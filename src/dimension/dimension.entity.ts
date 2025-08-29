// src/entities/dimension.entity.ts
import { Convenio } from 'src/convenio/convenio.entity';
import { Indicador } from 'src/indicador/indicador.entity';
import { Usuario } from 'src/usuario/usuario.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';

@Entity()
export class Dimension {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: 'float', nullable: true  })
  ponderacion: number;

  @ManyToOne(() => Convenio, convenio => convenio.dimensiones, { onDelete: 'CASCADE' })
  convenio: Convenio;

  @OneToMany(() => Indicador, indicador => indicador.dimension, { cascade: true, eager: true })
  indicadores: Indicador[];

  @ManyToMany(() => Usuario, { cascade: true })
  @JoinTable({
    name: 'dimension_responsables',
    joinColumn: {
      name: 'dimension_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'usuario_id',
      referencedColumnName: 'id',
    },
  })
  responsables: Usuario[];
}
