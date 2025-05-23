import { Module } from '@nestjs/common';
import { LineaTrabajoService } from './linea-trabajo.service';
import { LineaTrabajoController } from './linea-trabajo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LineaTrabajo } from './linea-trabajo.entity';

@Module({  
  imports: [TypeOrmModule.forFeature([LineaTrabajo])],
  providers: [LineaTrabajoService],
  controllers: [LineaTrabajoController]
})
export class LineaTrabajoModule {}
