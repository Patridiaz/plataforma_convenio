import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ConvenioModule } from './convenio/convenio.module';
import { TareaModule } from './tarea/tarea.module';
import { IndicadorModule } from './indicador/indicador.module';
import { SeguimientoModule } from './seguimiento/seguimiento.module';
import { EstablecimientoModule } from './establecimiento/establecimiento.module';
import { ArchivoModule } from './archivo/archivo.module';
import { SharedModule } from './shared/shared.module';
import { Usuario } from './usuario/usuario.entity';
import { ConfigModule } from '@nestjs/config';
import { Establecimiento } from './establecimiento/establecimiento.entity';
import { LineaTrabajoModule } from './linea-trabajo/linea-trabajo.module';
import { Tarea } from './tarea/tarea.entity';
import { LineaTrabajo } from './linea-trabajo/linea-trabajo.entity';
import { Convenio } from './convenio/convenio.entity';
import { Indicador } from './indicador/indicador.entity';
import { DimensionModule } from './dimension/dimension.module';
import { Dimension } from './dimension/dimension.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST,         
      port: parseInt(process.env.DB_PORT ?? '1432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      synchronize: true,         
      autoLoadEntities: true,    
      options: {
        encrypt: false,
        enableArithAbort: true,
      },
      entities: [
        Usuario,
        Establecimiento,
        Tarea,
        LineaTrabajo,
        Convenio,
        Indicador,
        Dimension,
      ]
    }),
    AuthModule,
    UsuarioModule,
    ConvenioModule,
    TareaModule,
    IndicadorModule,
    SeguimientoModule,
    EstablecimientoModule,
    ArchivoModule,
    SharedModule,
    LineaTrabajoModule,
    DimensionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
