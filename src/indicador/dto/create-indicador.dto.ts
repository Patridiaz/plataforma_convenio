// src/indicador/dto/create-indicador.dto.ts
import { IsString, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTareaDto } from 'src/tarea/dto/create-tarea.dto';
import { ManyToOne } from 'typeorm';
import { LineaTrabajo } from 'src/linea-trabajo/linea-trabajo.entity';

export class CreateIndicadorDto {
  @IsString()
  nombre: string;

  @IsString()
  descripcion: string;

  
  @IsString()  // Aquí debe coincidir el tipo de lineaTrabajo, si usas enum, cambiar acorde
  lineaTrabajo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTareaDto)
  tareas: CreateTareaDto[];
}
