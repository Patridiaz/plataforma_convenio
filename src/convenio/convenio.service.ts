// src/convenio/convenio.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Convenio } from './convenio.entity';
import { Repository } from 'typeorm';
import { CreateConvenioDto, CreateDimensionDto, CreateIndicadorDto, CreateTareaDto } from './dto/create-convenio.dto';
import { Usuario } from 'src/usuario/usuario.entity';
import { Indicador } from 'src/indicador/indicador.entity';
import { Tarea } from 'src/tarea/tarea.entity';
import { LineaTrabajo } from 'src/linea-trabajo/linea-trabajo.entity';
import { Dimension } from 'src/dimension/dimension.entity';
import { UpdateConvenioDto } from './dto/update-convenio.dto';

@Injectable()
export class ConvenioService {
  constructor(
    @InjectRepository(Convenio)
    private readonly repo: Repository<Convenio>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Dimension)
    private readonly dimensionRepo: Repository<Dimension>,
    @InjectRepository(Indicador)
    private readonly indicadorRepo: Repository<Indicador>,
    @InjectRepository(Tarea)
    private readonly tareaRepo: Repository<Tarea>,
    @InjectRepository(LineaTrabajo)
    private readonly lineaTrabajoRepo: Repository<LineaTrabajo>,
  ) {}

async create(dto: CreateConvenioDto, usuarioId: number) {
  const usuario = await this.usuarioRepo.findOne({
    where: { id: usuarioId },
    relations: ['establecimiento'],
  });
  if (!usuario) throw new NotFoundException('Usuario no encontrado');

  const convenio = this.repo.create({
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    fechaInicio: dto.fechaInicio,
    fechaFin: dto.fechaFin,
    activo: dto.activo,
    creadoPor: usuario,
    establecimiento: usuario.establecimiento,
  });

if (dto.dimensiones?.length) {
  convenio.dimensiones = await Promise.all(dto.dimensiones.map(async dimDto => {
    const dimension = new Dimension();
    dimension.nombre = dimDto.nombre;
    dimension.ponderacion = dimDto.ponderacion;

    dimension.indicadores = await Promise.all(dimDto.indicadores.map(async ind => {
      const indicador = new Indicador();
      indicador.nombre = ind.nombre;
      indicador.descripcion = ind.descripcion;

      let lineaTrabajoEntity = await this.lineaTrabajoRepo.findOne({
        where: { nombre: ind.lineaTrabajo }
      });

      if (!lineaTrabajoEntity) {
        lineaTrabajoEntity = this.lineaTrabajoRepo.create({
          nombre: ind.lineaTrabajo,
          descripcion: ind.lineaTrabajo || 'Generado automáticamente', // ✅ fix
        });
        await this.lineaTrabajoRepo.save(lineaTrabajoEntity);
      }

      indicador.lineaTrabajo = lineaTrabajoEntity;
      indicador.tareas = ind.tareas.map(t => Object.assign(new Tarea(), t));
      return indicador;
    }));

    return dimension;
  }));
}

  // 1. Guardar
  const saved = await this.repo.save(convenio);

  // 2. Reconsultar con relaciones
  const loaded = await this.repo.findOne({
    where: { id: saved.id },
    relations: [
      'creadoPor',
      'establecimiento',
      'dimensiones',
      'dimensiones.indicadores',
      'dimensiones.indicadores.tareas',
    ],
  });

  // 3. Eliminar referencias circulares
  loaded?.dimensiones?.forEach(dimension => {
    delete (dimension as any).convenio;
    dimension.indicadores?.forEach(indicador => {
      delete (indicador as any).dimension;
      indicador.tareas?.forEach(tarea => {
        delete (tarea as any).indicador;
      });
    });
  });

  return loaded;
  }


  // convenio.service.ts
  findAll() {
    return this.repo.find({
      relations: ['establecimiento'], // <- incluye el objeto completo
    });
  }


  async findOne(id: number) {
    const convenio = await this.repo.findOne({
      where: { id },
      relations: [
        'creadoPor',
        'establecimiento',
        'dimensiones',
        'dimensiones.indicadores',
        'dimensiones.indicadores.tareas',
        'dimensiones.indicadores.lineaTrabajo' 
      ],
    });

    if (!convenio) throw new NotFoundException('Convenio no encontrado');
    return convenio;
  }


async update(id: number, dto: UpdateConvenioDto) {
  const convenio = await this.repo.findOne({
    where: { id },
    relations: [
      'creadoPor',
      'establecimiento',
      'dimensiones',
      'dimensiones.indicadores',
      'dimensiones.indicadores.tareas',
    ],
  });

  if (!convenio) {
    throw new NotFoundException('Convenio no encontrado');
  }

  // Solo actualizamos campos definidos en dto
  if (dto.titulo !== undefined) convenio.titulo = dto.titulo;
  if (dto.descripcion !== undefined) convenio.descripcion = dto.descripcion;
  if (dto.fechaInicio !== undefined) convenio.fechaInicio = new Date(dto.fechaInicio);
  if (dto.fechaFin !== undefined) convenio.fechaFin = new Date(dto.fechaFin);
  if (dto.activo !== undefined) convenio.activo = dto.activo;

  // Si vienen nuevas dimensiones, reemplazar completamente
if (dto.dimensiones) {
  const dimensiones = await Promise.all(dto.dimensiones.map(async dimDto => {
    const dimension = new Dimension();
    dimension.nombre = dimDto.nombre;
    dimension.ponderacion = dimDto.ponderacion;

    dimension.indicadores = await Promise.all(dimDto.indicadores.map(async indDto => {
      const indicador = new Indicador();
      indicador.nombre = indDto.nombre;
      indicador.descripcion = indDto.descripcion;

      // Buscar o crear lineaTrabajo
      let lineaTrabajo = await this.lineaTrabajoRepo.findOne({ where: { nombre: indDto.lineaTrabajo } });
      if (!lineaTrabajo) {
        lineaTrabajo = this.lineaTrabajoRepo.create({
          nombre: indDto.lineaTrabajo,
          descripcion: indDto.lineaTrabajo || 'Generado automáticamente', // ✅ fix
        });
        await this.lineaTrabajoRepo.save(lineaTrabajo);
      }

      indicador.lineaTrabajo = lineaTrabajo;
      indicador.tareas = indDto.tareas.map(t => Object.assign(new Tarea(), t));
      return indicador;
    }));

    return dimension;
  }));

  convenio.dimensiones = dimensiones; // asegúrate de reemplazar las dimensiones antiguas
}

  const saved = await this.repo.save(convenio);

  // Reconsultar para obtener todo con relaciones
  const updated = await this.repo.findOne({
    where: { id: saved.id },
    relations: [
      'creadoPor',
      'establecimiento',
      'dimensiones',
      'dimensiones.indicadores',
      'dimensiones.indicadores.tareas',
    ],
  });

  updated?.dimensiones?.forEach(dimension => {
    delete (dimension as any).convenio;
    dimension.indicadores?.forEach(indicador => {
      delete (indicador as any).dimension;
      indicador.tareas?.forEach(tarea => {
        delete (tarea as any).indicador;
      });
    });
  });

  return updated;
}


async addDimension(convenioId: number, dto: CreateDimensionDto) {
  const convenio = await this.repo.findOne({
    where: { id: convenioId },
    relations: ['dimensiones'],
  });

  if (!convenio) throw new NotFoundException('Convenio no encontrado');

  const dimension = this.dimensionRepo.create({
    nombre: dto.nombre,
    ponderacion: dto.ponderacion,
    convenio: convenio, // ✅ relación explícita
  });

  const saved = await this.dimensionRepo.save(dimension);
  return saved;
}


async addIndicador(dimensionId: number, dto: CreateIndicadorDto) {
  const dimension = await this.dimensionRepo.findOne({
    where: { id: dimensionId },
    relations: ['indicadores'],
  });
  if (!dimension) throw new NotFoundException('Dimensión no encontrada');

  // Buscar o crear LineaTrabajo a partir del nombre (string)
  let lineaTrabajo = await this.lineaTrabajoRepo.findOne({ where: { nombre: dto.lineaTrabajo } });
  if (!lineaTrabajo) {
    lineaTrabajo = this.lineaTrabajoRepo.create({ 
      nombre: dto.lineaTrabajo, 
      descripcion: dto.lineaTrabajo || 'Generado automáticamente'
}); 
    await this.lineaTrabajoRepo.save(lineaTrabajo);
  }

  const indicador = this.indicadorRepo.create({
    nombre: dto.nombre,
    descripcion: dto.descripcion,
    lineaTrabajo: lineaTrabajo, // ✅ ahora sí es un objeto, no un string
    dimension: dimension,
    tareas: dto.tareas.map(t => Object.assign(new Tarea(), t)),
  });

  return this.indicadorRepo.save(indicador);
}


  async addTarea(indicadorId: number, dto: CreateTareaDto) {
    const indicador = await this.indicadorRepo.findOne({ where: { id: indicadorId }, relations: ['tareas'] });
    if (!indicador) throw new NotFoundException('Indicador no encontrado');
    const tarea = this.tareaRepo.create({ ...dto, indicador });
    return this.tareaRepo.save(tarea);
  }








}
