// src/convenio/convenio.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Put, Req, UseInterceptors, UploadedFile, Res, ParseIntPipe } from '@nestjs/common';
import { ConvenioService } from './convenio.service';
import { CreateConvenioDto, CreateIndicadorDto, CreateTareaDto } from './dto/create-convenio.dto';
import { CreateDimensionDto } from './dto/create-convenio.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth-guard';
import { Request } from '@nestjs/common';
import { UpdateConvenioDto } from './dto/update-convenio.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { existsSync } from 'fs';
import { AuthGuard } from '@nestjs/passport';


@Controller('convenios')
export class ConvenioController {
  constructor(private readonly convenioService: ConvenioService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateConvenioDto, @Request() req) {
    const usuarioId = req.user.userId; // viene del strategy
    return this.convenioService.create(dto, usuarioId);
  }

  @Get()
  findAll() {
    return this.convenioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.convenioService.findOne(+id);
  }

  @Post(':convenioId/dimensiones')
  async addDimension(
    @Param('convenioId') convenioId: number,
    @Body() dimensionDto: CreateDimensionDto,
  ) {
    return this.convenioService.addDimension(convenioId, dimensionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateConvenio(
    @Param('id') id: number,
    @Body() dto: UpdateConvenioDto,
    @Req() req: any
  ) {
    const userId = req.user.userId; // 👈 usa userId como en los otros métodos
    return this.convenioService.update(id, dto, userId);
  }

  // Convenios por director
  @UseGuards(JwtAuthGuard)
  @Get('list/director')
  findByDirector(@Request() req) {
    const directorId = req.user.userId;
    return this.convenioService.findByDirector(directorId);
  }

@Put(':convenioId/asignaciones')
async actualizarAsignaciones(
  @Param('convenioId') convenioId: number,
  @Body() asignaciones: { dimensionId: number; responsableIds: number[] }[]
) {
  return this.convenioService.actualizarAsignaciones(convenioId, asignaciones);
}

@UseGuards(JwtAuthGuard)
@Post(':dimensionId/indicadores')
async addIndicador(
  @Param('dimensionId') dimensionId: number,
  @Body() dto: CreateIndicadorDto,
  @Req() req: any,
) {
  const userId = req.user.userId;
  const userRole = req.user.rol;
  return this.convenioService.addIndicador(dimensionId, dto, userId,userRole);
}


@UseGuards(AuthGuard('jwt'))
@Patch('indicador/:id')
async updateIndicador(
  @Param('id') id: string,
  @Body() dto: Partial<CreateIndicadorDto>,
  @Request() req,
) {
  const userId = req.user.userId;
  const userRole = req.user.rol;

  return this.convenioService.updateIndicador(Number(id), dto, userId, userRole);
}


@UseGuards(JwtAuthGuard)
@Post(':indicadorId/tareas')
  @UseInterceptors(FileInterceptor('archivo', {
    storage: diskStorage({
      destination: './uploads/evidencias',
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Solo se permiten archivos PDF'), false);
      }
      cb(null, true);
    }
  }))
  async addTarea(
    @Param('indicadorId') indicadorId: number,
    @Body() dto: CreateTareaDto,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    if (archivo) {
      dto.evidencias = archivo.filename; // guarda solo nombre o ruta relativa
        // 🔎 Normaliza cadenas vacías
      if (dto.plazo === '') delete (dto as any).plazo;
      if (dto.cumplimiento === '') delete (dto as any).cumplimiento;
    }
    return this.convenioService.addTarea(indicadorId, dto);
  }

  // En convenio.controller.ts o similar
  @Get('descargar-evidencia/:nombre')
  async descargarEvidencia(
    @Param('nombre') nombre: string,
    @Res() res: Response
  ) {
    const ruta = join(__dirname, '..', '..', 'uploads', 'evidencias', nombre);

    if (existsSync(ruta)) {
      return res.sendFile(ruta, { root: '.' }); // importante: root
    } else {
      return res.status(404).json({ mensaje: 'Archivo no encontrado' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('asignados/gestion')
  findAsignadosGestion(@Request() req) {
    const userId = req.user.userId;
    return this.convenioService.findConveniosAsignados(userId);
  }

@UseGuards(JwtAuthGuard)
@Put('tareas/:id')
@UseInterceptors(FileInterceptor('archivo', {
  storage: diskStorage({
    destination: './uploads/evidencias',
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten archivos PDF'), false);
    }
    cb(null, true);
  }
}))


async actualizarTarea(
  @Param('id') tareaId: number,
  @Body() dto: CreateTareaDto,
  @UploadedFile() archivo?: Express.Multer.File
) {
  if (archivo) {
    dto.evidencias = archivo.filename;
  }
  return this.convenioService.actualizarTarea(tareaId, dto);
}


@UseGuards(JwtAuthGuard)
@Put('dimensiones/:id')
async actualizarDimension(
  @Param('id') id: number,
  @Body() dto: Partial<CreateDimensionDto>, // puedes crear UpdateDimensionDto si prefieres
  @Req() req: any
) {
  const userId = req.user.userId;
  return this.convenioService.actualizarDimension(id, dto, userId);
}




}
