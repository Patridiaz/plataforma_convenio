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

  async obtenerTodos(): Promise<Partial<Usuario>[]> {
    const usuarios = await this.repo.find({
      relations: ['establecimiento'],
    });

    return usuarios.map(({ password, ...rest }) => rest);
  }

  async actualizarUsuario(id: number, data: Partial<CreateUsuarioDto>) {
    const usuario = await this.repo.findOne({
      where: { id },
      relations: ['establecimiento'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se envía password, lo actualiza
    if (data.password) {
      usuario.password = await bcrypt.hash(data.password, 10);
    }

    // Si se envía un nuevo establecimientoId
    if (data.establecimientoId && data.establecimientoId !== usuario.establecimiento?.id) {
      const nuevoEst = await this.repoEstablecimiento.findOneBy({ id: data.establecimientoId });
      if (!nuevoEst) throw new NotFoundException('Nuevo establecimiento no encontrado');
      usuario.establecimiento = nuevoEst;
    }

    // Otros campos
    usuario.nombre = data.nombre ?? usuario.nombre;
    usuario.email = data.email ?? usuario.email;
    usuario.rol = data.rol ?? usuario.rol;

    return this.repo.save(usuario);
  }

  async eliminarUsuario(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  // Usuarios con rol GESTION_ESTABLECIMIENTO para un establecimiento específico
  async obtenerUsuariosGestionEstablecimientoPorEstablecimiento(establecimientoId: number): Promise<Partial<Usuario>[]> {
  const usuarios = await this.repo.find({
    where: {
      establecimiento: { id: establecimientoId },
    },
    relations: ['establecimiento'],
  });

  return usuarios.map(({ password, ...rest }) => rest);
}

}
