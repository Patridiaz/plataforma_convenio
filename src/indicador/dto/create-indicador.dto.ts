// src/indicador/dto/create-indicador.dto.ts
import { IsString, ValidateNested, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTareaDto } from 'src/tarea/dto/create-tarea.dto';
import { ManyToOne } from 'typeorm';
import { LineaTrabajo } from 'src/linea-trabajo/linea-trabajo.entity';

export class CreateIndicadorDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  lineaTrabajo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTareaDto)
  tareas?: CreateTareaDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  meta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  evaluacion?: number;

  @IsOptional()
  @IsString()
  consideraciones?: string;
}