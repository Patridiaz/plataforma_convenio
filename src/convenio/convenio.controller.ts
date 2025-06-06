// src/convenio/convenio.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Put } from '@nestjs/common';
import { ConvenioService } from './convenio.service';
import { CreateConvenioDto } from './dto/create-convenio.dto';
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

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateConvenioDto
  ) {
    return this.convenioService.update(+id, dto);
  }

}
