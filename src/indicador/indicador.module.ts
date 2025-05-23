import { Module } from '@nestjs/common';
import { IndicadorService } from './indicador.service';
import { IndicadorController } from './indicador.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LineaTrabajo } from 'src/linea-trabajo/linea-trabajo.entity';
import { Convenio } from 'src/convenio/convenio.entity';
import { Indicador } from './indicador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Indicador,LineaTrabajo,Convenio])],
  providers: [IndicadorService],
  controllers: [IndicadorController]
})
export class IndicadorModule {}
