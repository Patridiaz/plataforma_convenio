// src/establecimiento/establecimiento.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { EstablecimientoService } from './establecimiento.service';
import { CreateEstablecimientoDto } from './dto/create-establecimiento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';

@Controller('establecimientos')
export class EstablecimientoController {
  constructor(private readonly service: EstablecimientoService) {}


  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateEstablecimientoDto, @Request() req) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

}
