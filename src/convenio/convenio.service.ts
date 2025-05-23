// src/convenio/convenio.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Convenio } from './convenio.entity';
import { Repository } from 'typeorm';
import { CreateConvenioDto } from './dto/create-convenio.dto';
import { Usuario } from 'src/usuario/usuario.entity';
import { Indicador } from 'src/indicador/indicador.entity';
import { Tarea } from 'src/tarea/tarea.entity';
import { LineaTrabajo } from 'src/linea-trabajo/linea-trabajo.entity';

@Injectable()
export class ConvenioService {
  constructor(
    @InjectRepository(Convenio)
    private readonly repo: Repository<Convenio>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

async create(dto: CreateConvenioDto, usuarioId: number) {
  const usuario = await this.usuarioRepo.findOne({
    where: { id: usuarioId },
    relations: ['establecimiento'],
  });
  if (!usuario) throw new NotFoundException('Usuario no encontrado');

  // Crear la entidad Convenio con los datos base (sin indicadores)
  const convenio = this.repo.create({
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    fechaInicio: dto.fechaInicio,
    fechaFin: dto.fechaFin,
    activo: dto.activo,
    creadoPor: usuario,
    establecimiento: usuario.establecimiento,
  });

  // Si vienen indicadores, mapearlos y crear entidades Indicador y sus Tareas
  if (dto.indicadores && dto.indicadores.length > 0) {
    convenio.indicadores = dto.indicadores.map(indicadorDto => {
      const indicador = new Indicador();
      indicador.nombre = indicadorDto.nombre;
      indicador.descripcion = indicadorDto.descripcion;
      indicador.lineaTrabajo = LineaTrabajo[indicadorDto.lineaTrabajo as keyof typeof LineaTrabajo];

      // Mapear las tareas (si existen)
      if (indicadorDto.tareas && indicadorDto.tareas.length > 0) {
        indicador.tareas = indicadorDto.tareas.map(tareaDto => {
          const tarea = new Tarea();
          tarea.descripcion = tareaDto.descripcion;
          tarea.plazo = tareaDto.plazo;
          tarea.cumplimiento = tareaDto.cumplimiento ;
          tarea.evidencias = tareaDto.evidencias ;
          tarea.eval = tareaDto.eval ;
          tarea.obs = tareaDto.obs ;
          return tarea;
        });
      }
      return indicador;
    });
  }

  return this.repo.save(convenio);
}

  findAll() {
    return this.repo.find({ relations: ['creadoPor'] });
  }

  async findOne(id: number) {
    const convenio = await this.repo.findOne({ where: { id }, relations: ['creadoPor'] });
    if (!convenio) throw new NotFoundException('Convenio no encontrado');
    return convenio;
  }


}
