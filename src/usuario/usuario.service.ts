import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { Establecimiento } from 'src/establecimiento/establecimiento.entity';

@Injectable()
export class UsuarioService {
    constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
    @InjectRepository(Establecimiento)
    private readonly repoEstablecimiento: Repository<Establecimiento>,
  ) {}

  async crearUsuario(data: CreateUsuarioDto) {
   const establecimiento = await this.repoEstablecimiento.findOneBy({ id: data.establecimientoId });
  if (!establecimiento) {
    throw new NotFoundException('Establecimiento no encontrado');
  }

  const user = this.repo.create(data);
  user.password = await bcrypt.hash(data.password, 10);
  user.establecimiento = establecimiento;

  return this.repo.save(user);
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }
}
