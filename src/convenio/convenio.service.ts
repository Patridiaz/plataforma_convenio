// src/convenio/convenio.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  if (!usuario || usuario.rol !== 'Director Establecimiento') {
    throw new ForbiddenException('Solo un Director puede crear convenios');
  }

  const establecimiento = usuario.establecimiento;

  const convenio = this.repo.create({
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    fechaInicio: dto.fechaInicio,
    fechaFin: dto.fechaFin,
    activo: dto.activo,
    creadoPor: usuario,
    establecimiento,
  });

  // Solo mapear dimensiones si vienen y tienen elementos
  if (dto.dimensiones?.length) {
    convenio.dimensiones = await Promise.all(dto.dimensiones.map(async (dimDto) => {
      if (!dimDto.nombre) {
        throw new BadRequestException('La dimensión debe tener un nombre');
      }
      if (dimDto.ponderacion === undefined || dimDto.ponderacion === null) {
        throw new BadRequestException('La dimensión debe tener una ponderación');
      }

      const dimension = new Dimension();
      dimension.nombre = dimDto.nombre;
      dimension.ponderacion = dimDto.ponderacion;

      // Buscar responsable si viene en el DTO y no es null/undefined
      if (dimDto.responsableId != null) {
        const responsable = await this.usuarioRepo.findOne({
          where: {
            id: dimDto.responsableId,
            establecimiento: { id: establecimiento.id },
            rol: 'Gestion Establecimiento',
          },
          relations: ['establecimiento'],
        });

        if (!responsable) {
          throw new BadRequestException(`Responsable inválido para la dimensión ${dimDto.nombre}`);
        }
        dimension.responsable = responsable;
      }

      // Mapear indicadores solo si existen
      if (dimDto.indicadores?.length) {
        dimension.indicadores = await Promise.all(dimDto.indicadores.map(async ind => {
          if (!ind.nombre) {
            throw new BadRequestException('El indicador debe tener un nombre');
          }
          if (!ind.lineaTrabajo) {
            throw new BadRequestException('El indicador debe tener línea de trabajo');
          }

          const indicador = new Indicador();
          indicador.nombre = ind.nombre;
          indicador.descripcion = ind.descripcion ?? '';

          let lineaTrabajoEntity = await this.lineaTrabajoRepo.findOne({ where: { nombre: ind.lineaTrabajo } });
          if (!lineaTrabajoEntity) {
            lineaTrabajoEntity = this.lineaTrabajoRepo.create({
              nombre: ind.lineaTrabajo,
              descripcion: ind.lineaTrabajo || 'Generado automáticamente',
            });
            await this.lineaTrabajoRepo.save(lineaTrabajoEntity);
          }
          indicador.lineaTrabajo = lineaTrabajoEntity;

          // Mapear tareas solo si existen
          if (ind.tareas?.length) {
            indicador.tareas = ind.tareas.map(t => Object.assign(new Tarea(), t));
          } else {
            indicador.tareas = [];
          }

          return indicador;
        }));
      } else {
        dimension.indicadores = [];
      }

      return dimension;
    }));
  } else {
    convenio.dimensiones = [];
  }

  const saved = await this.repo.save(convenio);
  return this.findOne(saved.id);
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
        'dimensiones.indicadores.lineaTrabajo',
        'dimensiones.responsable',
      ],
    });

    if (!convenio) throw new NotFoundException('Convenio no encontrado');
    return convenio;
  }


async update(id: number, dto: UpdateConvenioDto, usuarioId: number) {
  const convenio = await this.repo.findOne({
    where: { id },
    relations: [
      'creadoPor',
      'establecimiento',
      'dimensiones',
      'dimensiones.responsable',
    ],
  });

  if (!convenio) throw new NotFoundException('Convenio no encontrado');

  // Buscar usuario que intenta editar
  const usuario = await this.usuarioRepo.findOne({
    where: { id: usuarioId },
    relations: ['establecimiento'],
  });

  if (!usuario) throw new ForbiddenException('Usuario no encontrado');

  const isDirector = convenio.creadoPor.id === usuarioId;
  const isResponsableAsignado = convenio.dimensiones.some(
    (dim) => dim.responsable?.id === usuarioId
  );

  if (!isDirector && !(usuario.rol === 'Gestion Establecimiento' && isResponsableAsignado)) {
    throw new ForbiddenException('No tienes permisos para editar este convenio');
  }

  // Actualizar campos si están definidos en dto
  if (dto.titulo !== undefined) convenio.titulo = dto.titulo;
  if (dto.descripcion !== undefined) convenio.descripcion = dto.descripcion;
  if (dto.fechaInicio !== undefined) convenio.fechaInicio = new Date(dto.fechaInicio);
  if (dto.fechaFin !== undefined) convenio.fechaFin = new Date(dto.fechaFin);
  if (dto.activo !== undefined) convenio.activo = dto.activo;

  // Reemplazar dimensiones si vienen en dto
  if (dto.dimensiones) {
    const dimensiones = await Promise.all(dto.dimensiones.map(async dimDto => {
      if (!dimDto.nombre) {
        throw new BadRequestException('La dimensión debe tener un nombre');
      }
      if (dimDto.ponderacion === undefined || dimDto.ponderacion === null) {
        throw new BadRequestException('La dimensión debe tener una ponderación');
      }

      const dimension = new Dimension();
      dimension.nombre = dimDto.nombre;
      dimension.ponderacion = dimDto.ponderacion;

      // Buscar responsable si responsableId está presente y no es null
      if (dimDto.responsableId != null) {
        const responsable = await this.usuarioRepo.findOne({
          where: {
            id: dimDto.responsableId,
            establecimiento: { id: convenio.establecimiento.id },
            rol: 'Gestion Establecimiento',
          },
          relations: ['establecimiento'],
        });
        if (!responsable) {
          throw new BadRequestException(`Responsable inválido para la dimensión ${dimDto.nombre}`);
        }
        dimension.responsable = responsable;
      }

      // Mapear indicadores solo si vienen
      if (dimDto.indicadores?.length) {
        dimension.indicadores = await Promise.all(dimDto.indicadores.map(async indDto => {
          if (!indDto.nombre) {
            throw new BadRequestException('El indicador debe tener un nombre');
          }
          if (!indDto.lineaTrabajo) {
            throw new BadRequestException('El indicador debe tener línea de trabajo');
          }

          const indicador = new Indicador();
          indicador.nombre = indDto.nombre;
          indicador.descripcion = indDto.descripcion ?? '';

          let lineaTrabajo = await this.lineaTrabajoRepo.findOne({ where: { nombre: indDto.lineaTrabajo } });
          if (!lineaTrabajo) {
            lineaTrabajo = this.lineaTrabajoRepo.create({
              nombre: indDto.lineaTrabajo,
              descripcion: indDto.lineaTrabajo || 'Generado automáticamente',
            });
            await this.lineaTrabajoRepo.save(lineaTrabajo);
          }

          indicador.lineaTrabajo = lineaTrabajo;

          indicador.tareas = indDto.tareas?.length
            ? indDto.tareas.map(t => Object.assign(new Tarea(), t))
            : [];

          return indicador;
        }));
      } else {
        dimension.indicadores = [];
      }

      return dimension;
    }));

    convenio.dimensiones = dimensiones;
  }

  const saved = await this.repo.save(convenio);

  // Recargar con relaciones completas
  const updated = await this.repo.findOne({
    where: { id: saved.id },
    relations: [
      'creadoPor',
      'establecimiento',
      'dimensiones',
      'dimensiones.responsable',
      'dimensiones.indicadores',
      'dimensiones.indicadores.tareas',
    ],
  });

  // Limpiar referencias circulares para la respuesta
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


async addIndicador(dimensionId: number, dto: CreateIndicadorDto, userId: number) {
  const dimension = await this.dimensionRepo.findOne({
    where: { id: dimensionId },
    relations: ['indicadores', 'responsable', 'convenio', 'convenio.creadoPor'],
  });

  if (!dimension) {
    throw new NotFoundException('Dimensión no encontrada');
  }

  const isResponsable = dimension.responsable?.id === userId;
  const isDirector = dimension.convenio?.creadoPor?.id === userId;

  if (!isResponsable && !isDirector) {
    throw new ForbiddenException('No tienes permisos para agregar indicadores en esta dimensión');
  }

  // Buscar o crear línea de trabajo
  let lineaTrabajo = await this.lineaTrabajoRepo.findOne({ where: { nombre: dto.lineaTrabajo } });
  if (!lineaTrabajo) {
    lineaTrabajo = this.lineaTrabajoRepo.create({
      nombre: dto.lineaTrabajo,
      descripcion: dto.lineaTrabajo || 'Generado automáticamente',
    });
    await this.lineaTrabajoRepo.save(lineaTrabajo);
  }

  const indicador = this.indicadorRepo.create({
    nombre: dto.nombre,
    descripcion: dto.descripcion,
    lineaTrabajo,
    dimension,
    tareas: dto.tareas?.map(t => Object.assign(new Tarea(), t)),
  });

  return this.indicadorRepo.save(indicador);
}




  async addTarea(indicadorId: number, dto: CreateTareaDto) {
    const indicador = await this.indicadorRepo.findOne({ where: { id: indicadorId }, relations: ['tareas'] });
    if (!indicador) throw new NotFoundException('Indicador no encontrado');
    const tarea = this.tareaRepo.create({ ...dto, indicador });
    return this.tareaRepo.save(tarea);
  }


  // Método para obtener convenios por director
  async findByDirector(directorId: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: directorId },
      relations: ['establecimiento'],
    });

    if (!usuario || usuario.rol !== 'Director Establecimiento') {
      throw new ForbiddenException('No autorizado');
    }

    return this.repo.find({
      where: { creadoPor: { id: directorId } },
      relations: ['dimensiones', 'establecimiento'],
      order: { fechaInicio: 'DESC' },
    });
  }

  // src/convenio/convenio.service.ts
async actualizarAsignaciones(
  convenioId: number,
  asignaciones: { dimensionId: number; responsableId: number | null }[],
) {
  const convenio = await this.repo.findOne({
    where: { id: convenioId },
    relations: ['dimensiones', 'dimensiones.responsable', 'establecimiento'],
  });

  if (!convenio) throw new NotFoundException('Convenio no encontrado');

  // Validar que las dimensiones correspondan al convenio
  const dimensionIds = convenio.dimensiones.map(d => d.id);
  for (const asignacion of asignaciones) {
    if (!dimensionIds.includes(asignacion.dimensionId)) {
      throw new BadRequestException(
        `La dimensión ${asignacion.dimensionId} no pertenece al convenio ${convenioId}`
      );
    }
  }

  // Actualizar cada dimensión con su nuevo responsable
  for (const asignacion of asignaciones) {
    const dimension = convenio.dimensiones.find(d => d.id === asignacion.dimensionId);

    if (!dimension) {
      throw new NotFoundException(`Dimensión con id ${asignacion.dimensionId} no encontrada en el convenio`);
    }

    if (asignacion.responsableId == null) {
      dimension.responsable = null;
      continue;
    }

    const responsable = await this.usuarioRepo.findOne({
      where: {
        id: asignacion.responsableId,
        establecimiento: { id: convenio.establecimiento.id },
        rol: 'Gestion Establecimiento',
      },
      relations: ['establecimiento'],
    });

    if (!responsable) {
      throw new BadRequestException(`Responsable inválido para la dimensión ${dimension.nombre}`);
    }

    dimension.responsable = responsable;
  }

  await this.dimensionRepo.save(convenio.dimensiones);

  return convenio.dimensiones;
}

// En convenio.service.ts
async findConveniosAsignados(userId: number) {
  const usuario = await this.usuarioRepo.findOne({
    where: { id: userId },
    relations: ['establecimiento'],
  });

  if (!usuario || usuario.rol !== 'Gestion Establecimiento') {
    throw new ForbiddenException('No autorizado');
  }

  // Buscar dimensiones asignadas al usuario
  const dimensiones = await this.dimensionRepo.find({
    where: { responsable: { id: userId } },
    relations: ['convenio', 'convenio.establecimiento', 'convenio.creadoPor'],
  });

  // Extraer convenios únicos
  const conveniosMap = new Map<number, Convenio>();
  for (const dim of dimensiones) {
    if (dim.convenio) {
      const convenioCompleto = await this.repo.findOne({
        where: { id: dim.convenio.id },
        relations: [
          'dimensiones',
          'dimensiones.responsable',
          'dimensiones.indicadores',
          'dimensiones.indicadores.lineaTrabajo',
          'dimensiones.indicadores.tareas',
          'establecimiento',
          'creadoPor',
        ],
      });
      if (convenioCompleto) conveniosMap.set(convenioCompleto.id, convenioCompleto);
    }
  }

  return Array.from(conveniosMap.values());
}





}
