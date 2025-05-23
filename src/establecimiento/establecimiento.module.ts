import { Module } from '@nestjs/common';
import { EstablecimientoService } from './establecimiento.service';
import { EstablecimientoController } from './establecimiento.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/usuario/usuario.entity';
import { Establecimiento } from './establecimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario,Establecimiento])],
  providers: [EstablecimientoService],
  controllers: [EstablecimientoController]
})
export class EstablecimientoModule {}
