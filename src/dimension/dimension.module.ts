import { Module } from '@nestjs/common';
import { DimensionService } from './dimension.service';
import { DimensionController } from './dimension.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Convenio } from 'src/convenio/convenio.entity';
import { Indicador } from 'src/indicador/indicador.entity';
import { Dimension } from './dimension.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Convenio,Indicador,Dimension])],
  providers: [DimensionService],
  controllers: [DimensionController]
})
export class DimensionModule {}
