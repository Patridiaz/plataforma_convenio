// src/convenio/dto/create-convenio.dto.ts
import { IsString, IsDateString, IsBoolean, ValidateNested, IsArray, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTareaDto {
  @IsString()
  descripcion: string;

  @IsDateString()
  plazo: string;

  @IsString()
  cumplimiento: string;

  @IsString()
  evidencias: string;

  @IsString()
  eval: string;

  @IsString()
  obs: string;
}

export class CreateIndicadorDto {
  @IsString()
  nombre: string;

  @IsString()
  descripcion: string;

  @IsString()
  lineaTrabajo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTareaDto)
  tareas: CreateTareaDto[];
}

export class CreateDimensionDto {
  @IsString()
  nombre: string;

  @IsNumber()
  ponderacion: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIndicadorDto)
  indicadores: CreateIndicadorDto[];
}

export class CreateConvenioDto {
  @IsString()
  titulo: string;

  @IsString()
  descripcion: string;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsBoolean()
  activo: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDimensionDto)
  dimensiones?: CreateDimensionDto[];
}