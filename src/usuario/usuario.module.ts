import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { Establecimiento } from 'src/establecimiento/establecimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario,Establecimiento])],
  providers: [UsuarioService],
  controllers: [UsuarioController],
  exports: [UsuarioService], // 🔥 Asegúrate de exportarlo
})
export class UsuarioModule {}
