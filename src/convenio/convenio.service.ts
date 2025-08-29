// src/convenio/convenio.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Convenio } from './convenio.entity';
import { DataSource, DeepPartial, In, Repository } from 'typeorm';
import { CreateConvenioDto, CreateDimensionDto, CreateIndicadorDto, CreateTareaDto } from './dto/create-convenio.dto';
import { Usuario } from 'src/usuario/usuario.entity';
import { Indicador } from 'src/indicador/indicador.entity';
import { Tarea } from 'src/tarea/tarea.entity';
import { LineaTrabajo } from 'src/linea-trabajo/linea-trabajo.entity';
import { Dimension } from 'src/dimension/dimension.entity';
import { UpdateConvenioDto } from './dto/update-convenio.dto';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Establecimiento } from 'src/establecimiento/establecimiento.entity';



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
     private readonly dataSource: DataSource, // para transacciones,
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
            establecimiento: { id: establecimiento.id }
          },
          relations: ['establecimiento'],
        });

        if (!responsable) {
          throw new BadRequestException(`Responsable inválido para la dimensión ${dimDto.nombre}`);
        }
        dimension.responsables = [responsable];
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
          indicador.meta = ind.meta ?? undefined;
          indicador.evaluacion = ind.evaluacion ?? undefined;
          indicador.consideraciones = ind.consideraciones ?? '';

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
        'dimensiones.responsables',
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
      'dimensiones.responsables',
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
    (dim) => dim.responsables[0]?.id === usuarioId
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
            establecimiento: { id: convenio.establecimiento.id }
          },
          relations: ['establecimiento'],
        });
        if (!responsable) {
          throw new BadRequestException(`Responsable inválido para la dimensión ${dimDto.nombre}`);
        }
        dimension.responsables = [responsable];
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
      'dimensiones.responsables',
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

// Agregar dimensiones a un convenio
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


// Agregar un indicador a una dimensión
async addIndicador(dimensionId: number, dto: CreateIndicadorDto, userId: number,userRole: string) {
  const dimension = await this.dimensionRepo.findOne({
    where: { id: dimensionId },
    relations: ['indicadores', 'responsables', 'convenio', 'convenio.creadoPor'],
  });

  if (!dimension) {
    throw new NotFoundException('Dimensión no encontrada');
  }

  const isResponsable = dimension.responsables[0]?.id === userId;
  const isDirector = dimension.convenio?.creadoPor?.id === userId;
  const isRevisor = userRole === 'Revisor';
  const isGestionEstablecimiento = userRole === 'Gestion Establecimiento';

  if (!isResponsable && !isDirector && !isRevisor && !isGestionEstablecimiento) {
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
    descripcion: dto.descripcion ?? '',
    lineaTrabajo,
    dimension,
    tareas: dto.tareas?.map(t => Object.assign(new Tarea(), t)) || [],
    meta: dto.meta ?? null,
    evaluacion: dto.evaluacion ?? null,
    consideraciones: dto.consideraciones ?? null,
  } as Partial<Indicador>);

  return this.indicadorRepo.save(indicador);
}

async updateIndicador(indicadorId: number, dto: Partial<CreateIndicadorDto>, userId: number,userRole: string,) {
  const indicador = await this.indicadorRepo.findOne({
    where: { id: indicadorId },
    relations: ['dimension', 'dimension.responsables', 'dimension.convenio', 'dimension.convenio.creadoPor'],
  });

  if (!indicador) {
    throw new NotFoundException('Indicador no encontrado');
  }

  const dimension = indicador.dimension;

  const isResponsable = dimension.responsables.some(r => r.id === userId);
  const isDirector = dimension.convenio?.creadoPor?.id === userId;
  const isRevisor = userRole === 'Revisor';

if (!isResponsable && !isDirector && !isRevisor) {
  throw new ForbiddenException('No tienes permisos para editar este indicador');
}
  // Si se actualiza la línea de trabajo
  if (dto.lineaTrabajo) {
    let lineaTrabajo = await this.lineaTrabajoRepo.findOne({ where: { nombre: dto.lineaTrabajo } });
    if (!lineaTrabajo) {
      lineaTrabajo = this.lineaTrabajoRepo.create({
        nombre: dto.lineaTrabajo,
        descripcion: dto.lineaTrabajo || 'Generado automáticamente',
      });
      await this.lineaTrabajoRepo.save(lineaTrabajo);
    }
    indicador.lineaTrabajo = lineaTrabajo;
  }

  // Actualizar los campos simples
  indicador.nombre = dto.nombre ?? indicador.nombre;
  indicador.descripcion = dto.descripcion ?? indicador.descripcion;
  indicador.meta = dto.meta ?? indicador.meta;
  indicador.evaluacion = dto.evaluacion ?? indicador.evaluacion;
  indicador.consideraciones = dto.consideraciones ?? indicador.consideraciones;

  return this.indicadorRepo.save(indicador);
}


  // Agregar una tarea a un indicador
async addTarea(indicadorId: number, dto: CreateTareaDto) {
  const indicador = await this.indicadorRepo.findOne({
    where: { id: indicadorId },
    relations: ['tareas'],
  });
  if (!indicador) throw new NotFoundException('Indicador no encontrado');

  // Validar fechas
  const cumplimiento = dto.cumplimiento ? new Date(dto.cumplimiento) : null;
  const plazo = dto.plazo ? new Date(dto.plazo) : null;

  if (cumplimiento && isNaN(cumplimiento.getTime())) {
    throw new BadRequestException('La fecha de cumplimiento no es válida');
  }
  if (plazo && isNaN(plazo.getTime())) {
    throw new BadRequestException('La fecha de plazo no es válida');
  }

  const tarea = this.tareaRepo.create({
    descripcion: dto.descripcion ?? null,
    plazo: plazo ? plazo.toISOString().split('T')[0] : null,
    cumplimiento: cumplimiento ? cumplimiento.toISOString().split('T')[0] : null,
    evidencias: dto.evidencias ?? null,
    obs: dto.obs ?? null,
    indicador: indicador,
  } as Partial<Tarea>);
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
  asignaciones: { dimensionId: number; responsableIds: number[] }[],
) {
  const convenio = await this.repo.findOne({
    where: { id: convenioId },
    relations: ['dimensiones', 'dimensiones.responsables', 'establecimiento'],
  });

  if (!convenio) throw new NotFoundException('Convenio no encontrado');

  const dimensionIds = convenio.dimensiones.map(d => d.id);

  for (const asignacion of asignaciones) {
    if (!dimensionIds.includes(asignacion.dimensionId)) {
      throw new BadRequestException(
        `La dimensión ${asignacion.dimensionId} no pertenece al convenio ${convenioId}`
      );
    }
  }

  for (const asignacion of asignaciones) {
    const dimension = convenio.dimensiones.find(d => d.id === asignacion.dimensionId);
    if (!dimension) {
      throw new NotFoundException(`Dimensión con id ${asignacion.dimensionId} no encontrada`);
    }

    if (!asignacion.responsableIds || asignacion.responsableIds.length === 0) {
      dimension.responsables = []; // ← corregido a plural
      continue;
    }

    // ✅ Corrección aquí: buscar todos los usuarios válidos con operador `In`
    const responsables = await this.usuarioRepo.find({
      where: {
        id: In(asignacion.responsableIds),
        establecimiento: { id: convenio.establecimiento.id }
      },
      relations: ['establecimiento'],
    });

    if (responsables.length !== asignacion.responsableIds.length) {
      throw new BadRequestException(`Uno o más responsables inválidos en dimensión ${dimension.id}`);
    }

    dimension.responsables = responsables; // ← corregido a plural
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

  if (!usuario) {
    throw new ForbiddenException('No autorizado');
  }

  // ✅ Si es Revisor, devolver todos los convenios
  if (usuario.rol === 'Revisor') {
    return this.repo.find({
      relations: [
        'dimensiones',
        'dimensiones.responsables',
        'dimensiones.indicadores',
        'dimensiones.indicadores.lineaTrabajo',
        'dimensiones.indicadores.tareas',
        'establecimiento',
        'creadoPor',
      ],
      order: { fechaInicio: 'DESC' },
    });
  }

  // ✅ Si es Gestión Establecimiento, solo los asignados
  if (usuario.rol === 'Gestion Establecimiento' ||usuario.rol === 'Director Establecimiento') {
    const dimensiones = await this.dimensionRepo.find({
      where: { responsables: { id: userId } },
      relations: ['convenio', 'convenio.establecimiento', 'convenio.creadoPor'],
    });

    const conveniosMap = new Map<number, Convenio>();
    for (const dim of dimensiones) {
      if (dim.convenio) {
        const convenioCompleto = await this.repo.findOne({
          where: { id: dim.convenio.id },
          relations: [
            'dimensiones',
            'dimensiones.responsables',
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

  // ❌ Otros roles no autorizados
  throw new ForbiddenException('No autorizado');
}

// Actualizar una tarea existente
async actualizarTarea(tareaId: number, dto: CreateTareaDto): Promise<Tarea> {
  const tarea = await this.tareaRepo.findOne({
    where: { id: tareaId },
  });

  if (!tarea) {
    throw new NotFoundException(`Tarea con ID ${tareaId} no encontrada`);
  }

  // ✅ Convertir fechas y actualizar campos
  if (dto.descripcion !== undefined) tarea.descripcion = dto.descripcion;
if (dto.plazo !== undefined) {
  if (dto.plazo === '' || dto.plazo === null) {
    tarea.plazo = null; // O lo que quieras cuando la fecha está vacía
  } else {
    const fechaPlazo = new Date(dto.plazo);
    if (isNaN(fechaPlazo.getTime())) {
      throw new BadRequestException('Fecha de plazo inválida');
    }
    tarea.plazo = fechaPlazo.toISOString().split('T')[0];
  }
}

if (dto.cumplimiento !== undefined) {
  if (dto.cumplimiento === '' || dto.cumplimiento === null) {
    tarea.cumplimiento = null;
  } else {
    const fechaCumplimiento = new Date(dto.cumplimiento);
    if (isNaN(fechaCumplimiento.getTime())) {
      throw new BadRequestException('Fecha de cumplimiento inválida');
    }
    tarea.cumplimiento = fechaCumplimiento.toISOString().split('T')[0];
  }
}

  if (dto.evidencias !== undefined) tarea.evidencias = dto.evidencias;
  if (dto.obs !== undefined) tarea.obs = dto.obs;

  return this.tareaRepo.save(tarea);
}

async actualizarDimension(
  dimensionId: number,
  dto: Partial<CreateDimensionDto>,
  userId: number
) {
  const dimension = await this.dimensionRepo.findOne({
    where: { id: dimensionId },
    relations: ['responsables', 'convenio', 'convenio.creadoPor'],
  });

  if (!dimension) throw new NotFoundException('Dimensión no encontrada');

  const esDirector = dimension.convenio?.creadoPor?.id === userId;
  const esResponsable = dimension.responsables[0]?.id === userId;

  if (!esDirector && !esResponsable) {
    throw new ForbiddenException('No tienes permisos para editar esta dimensión');
  }

  if (dto.nombre !== undefined) {
    dimension.nombre = dto.nombre;
  }

  if (dto.ponderacion !== undefined) {
    dimension.ponderacion = dto.ponderacion;
  }

  // Solo el director puede cambiar el responsable
  if (dto.responsableId !== undefined && esDirector) {
    if (dto.responsableId === null) {
      dimension.responsables = [];
    } else {
      const nuevoResponsable = await this.usuarioRepo.findOne({
        where: {
          id: dto.responsableId,
          establecimiento: { id: dimension.convenio.establecimiento.id }
        },
        relations: ['establecimiento'],
      });

      if (!nuevoResponsable) {
        throw new BadRequestException('Responsable inválido');
      }

      dimension.responsables = [nuevoResponsable];
    }
  }

  const saved = await this.dimensionRepo.save(dimension);
  return saved;
}


  async finalizarConvenio(convenioId: number, userId: number, rol: string) {
    const convenio = await this.repo.findOne({ where: { id: convenioId } });
    if (!convenio) throw new NotFoundException('Convenio no encontrado');

    // Solo Revisor puede finalizar
    if (rol !== 'Revisor') {
      throw new ForbiddenException('No tienes permisos para finalizar este convenio');
    }

    convenio.activo = false;
    return this.repo.save(convenio); // ✅ aquí guardamos correctamente
  }



// Método privado para parsear fechas
  private parseExcelDate(value: any): Date | null {
    if (!value) return null;

    // Si ya es Date
    if (value instanceof Date && !isNaN(value.getTime())) return value;

    // Si es número (Excel date)
    if (typeof value === 'number') {
      // XLSX usa fechas desde 1900
      const d = XLSX.SSF.parse_date_code(value);
      return new Date(d.y, d.m - 1, d.d);
    }

    // Intentar parsear string
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // Función principal de importación
async descargarPlantillaExcel(res: Response) {
  const wsConvenio = XLSX.utils.json_to_sheet([
    { titulo: 'Ejemplo Convenio', 
      descripcion: 'Descripción del convenio', 
      fechaInicio: '2025-01-01', 
      fechaFin: '2025-12-31', 
      creadoPorEmail: 'usuario@correo.com',
    }
  ]);

  const wsLineasTrabajo = XLSX.utils.json_to_sheet([
    { nombre: 'Linea 1', descripcion: 'Descripción de la línea de trabajo' }
  ]);

  const wsDimensiones = XLSX.utils.json_to_sheet([
    { nombre: 'Gestión Pedagógica' } // 🔹 ya no tiene "lineaTrabajo"
  ]);

  const wsIndicadores = XLSX.utils.json_to_sheet([
    { nombre: 'Indicador 1', meta: 80, evaluacion: '', consideraciones: '', dimensionNombre: 'Gestión Pedagógica', lineaTrabajo: 'Linea 1' } // 🔹 ahora acá va la linea
  ]);

  const wsTareas = XLSX.utils.json_to_sheet([
    { descripcion: 'Tarea ejemplo', plazo: '2025-06-30', cumplimiento: '', evidencias: '', obs: '', indicadorNombre: 'Indicador 1' }
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsConvenio, 'Convenio');
  XLSX.utils.book_append_sheet(workbook, wsLineasTrabajo, 'LineasTrabajo');
  XLSX.utils.book_append_sheet(workbook, wsDimensiones, 'Dimensiones');
  XLSX.utils.book_append_sheet(workbook, wsIndicadores, 'Indicadores');
  XLSX.utils.book_append_sheet(workbook, wsTareas, 'Tareas');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=plantilla_convenio.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.end(buffer);
}

async importarDesdeExcel(file: Express.Multer.File) {
  try {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });

    return await this.dataSource.transaction(async (manager) => {
      let convenioCreado: Convenio | null = null;

      // === CONVENIO ===
      const convenioSheet = workbook.Sheets['Convenio'];
      if (!convenioSheet) throw new Error('No se encontró la hoja "Convenio".');

      const [convenioRow] = XLSX.utils.sheet_to_json<any>(convenioSheet);
      const { titulo, descripcion, fechaInicio, fechaFin,creadoPorEmail  } = convenioRow;
      if (!titulo || !fechaInicio || !fechaFin) throw new Error('Datos incompletos en hoja "Convenio".');

      // 🔹 Buscar el usuario por email
      let creadoPor: Usuario | null = null;
      let establecimiento: Establecimiento | null = null;
      if (creadoPorEmail) {
        creadoPor = await manager.findOne(Usuario, { 
          where: { email: creadoPorEmail },
          relations: ['establecimiento']
         });
        if (!creadoPor) {
          throw new Error(`No se encontró un usuario con el email: ${creadoPorEmail}`);
        }
        establecimiento = creadoPor.establecimiento || null;
      }

      convenioCreado = manager.create(Convenio, { 
        titulo, 
        descripcion, 
        fechaInicio: this.parseExcelDate(fechaInicio), 
        fechaFin: this.parseExcelDate(fechaFin), 
        creadoPor,
        establecimiento,
      } as Partial<Convenio>);
      convenioCreado = await manager.save(convenioCreado);

      // === DIMENSIONES ===
      const dimensionesSheet = workbook.Sheets['Dimensiones'];
      const dimensionesMap = new Map<string, Dimension>();
      if (dimensionesSheet) {
        const dimensionesData = XLSX.utils.sheet_to_json<any>(dimensionesSheet);
        for (const row of dimensionesData) {
          const { nombre } = row;
          if (!nombre) continue;

          const dimension = manager.create(Dimension, { nombre, convenio: convenioCreado });
          const saved = await manager.save(dimension);
          dimensionesMap.set(nombre, saved);
        }
      }

      // === INDICADORES ===
      const indicadoresSheet = workbook.Sheets['Indicadores'];
      const indicadoresMap = new Map<string, Indicador>();
      if (indicadoresSheet) {
        const indicadoresData = XLSX.utils.sheet_to_json<any>(indicadoresSheet);
        for (const row of indicadoresData) {
          const { nombre, meta, evaluacion, consideraciones, dimensionNombre, lineaTrabajo } = row;
          const dimension = dimensionesMap.get(dimensionNombre);
          if (!dimension) continue;

          // 🔹 Buscar o crear la línea de trabajo
          let linea: LineaTrabajo | null = null;
          if (lineaTrabajo) {
            linea = await manager.findOne(LineaTrabajo, { where: { nombre: lineaTrabajo } });
            if (!linea) {
              linea = manager.create(LineaTrabajo, { nombre: lineaTrabajo, descripcion: lineaTrabajo || 'Generado automáticamente' });
              linea = await manager.save(linea);
            }
          }

          const indicador = manager.create(Indicador, { 
            nombre, 
            meta: meta !== undefined && meta !== '' ? Number(meta) : null,
            evaluacion: evaluacion !== undefined && evaluacion !== '' ? Number(evaluacion) : null,
            consideraciones,
            dimension,
            lineaTrabajo: linea, // 🔹 se asocia la instancia persistida
          } as Partial<Indicador>);

          await manager.save(indicador);
          indicadoresMap.set(nombre, indicador);
        }
      }

      // === TAREAS ===
      const tareasSheet = workbook.Sheets['Tareas'];
      if (tareasSheet) {
        const tareasData = XLSX.utils.sheet_to_json<any>(tareasSheet);
        for (const row of tareasData) {
          const { descripcion, plazo, cumplimiento, evidencias, obs, indicadorNombre } = row;
          if (!descripcion || !indicadorNombre) continue;

          const indicador = indicadoresMap.get(indicadorNombre);
          if (!indicador) continue;

          const tareaData: DeepPartial<Tarea> = {
            descripcion,
            plazo: this.parseExcelDate(plazo)?.toISOString().split('T')[0] || null,
            cumplimiento: this.parseExcelDate(cumplimiento)?.toISOString().split('T')[0] || null,
            evidencias,
            obs,
            indicador,
          };

          const tarea = manager.create(Tarea, tareaData);
          await manager.save(tarea);
        }
      }

      return { mensaje: 'Importación exitosa', convenioId: convenioCreado.id };
    });
  } catch (error) {
    console.error('Error importando Excel:', error);
    throw new Error(`Fallo al importar Excel: ${error.message}`);
  }
}
}