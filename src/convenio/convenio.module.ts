import { Module } from '@nestjs/common';
import { ConvenioService } from './convenio.service';
import { ConvenioController } from './convenio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Convenio } from './convenio.entity';
import { Usuario } from 'src/usuario/usuario.entity';
import { Indicador } from 'src/indicador/indicador.entity';
import { Establecimiento } from 'src/establecimiento/establecimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Convenio, Usuario,Indicador,Establecimiento])],
  providers: [ConvenioService],
  controllers: [ConvenioController]
})
export class ConvenioModule {}
