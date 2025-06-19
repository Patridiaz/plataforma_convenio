// src/convenio/convenio.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Put, Req } from '@nestjs/common';
import { ConvenioService } from './convenio.service';
import { CreateConvenioDto, CreateIndicadorDto, CreateTareaDto } from './dto/create-convenio.dto';
import { CreateDimensionDto } from './dto/create-convenio.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth-guard';
import { Request } from '@nestjs/common';
import { UpdateConvenioDto } from './dto/update-convenio.dto';


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
  @Body() asignaciones: { dimensionId: number; responsableId: number | null }[]
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
  return this.convenioService.addIndicador(dimensionId, dto, userId);
}

  @UseGuards(JwtAuthGuard)
  @Post(':indicadorId/tareas')
  async addTarea(
    @Param('indicadorId') indicadorId: number,
    @Body() dto: CreateTareaDto,
  ) {
    return this.convenioService.addTarea(indicadorId, dto);
  }

@UseGuards(JwtAuthGuard)
@Get('asignados/gestion')
findAsignadosGestion(@Request() req) {
  const userId = req.user.userId;
  return this.convenioService.findConveniosAsignados(userId);
}




}
