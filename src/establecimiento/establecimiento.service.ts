// src/establecimiento/establecimiento.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Establecimiento } from './establecimiento.entity';
import { CreateEstablecimientoDto } from './dto/create-establecimiento.dto';
import { Usuario } from '../usuario/usuario.entity';

@Injectable()
export class EstablecimientoService {
  constructor(
    @InjectRepository(Establecimiento)
    private readonly repo: Repository<Establecimiento>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

async create(dto: CreateEstablecimientoDto) {
  const est = this.repo.create(dto);
  return this.repo.save(est);
}


  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const est = await this.repo.findOne({ where: { id } });
    if (!est) throw new NotFoundException('Establecimiento no encontrado');
    return est;
  }
}
