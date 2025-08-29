// src/convenio/dto/create-convenio.dto.ts
import { IsString, IsDateString, IsBoolean, ValidateNested, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateTareaDto {
  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value === '' ? undefined : value)
  plazo?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value === '' ? undefined : value)
  cumplimiento?: string;

  
  // Evidencias como archivos, se manejará por separado con multer
  // Por lo tanto, aquí podrías omitirlo o aceptar solo una ruta/URL:
  @IsOptional()
  @IsString()
  evidencias?: string;

  @IsOptional()
  @IsString()
  obs?: string;
}

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
export class CreateDimensionDto {
  @IsOptional()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsNumber()
  ponderacion: number;

  @IsOptional()
  @IsNumber()
  responsableId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIndicadorDto)
  indicadores?: CreateIndicadorDto[];
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
