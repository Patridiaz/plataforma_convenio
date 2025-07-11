// src/convenio/dto/create-convenio.dto.ts
import { IsString, IsDateString, IsBoolean, ValidateNested, IsArray, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTareaDto {
  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsDateString()
  plazo?: string;

  @IsOptional()
  @IsDateString()
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

  @IsOptional()ñ
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTareaDto)
  tareas?: CreateTareaDto[];

  @IsOptional()
  @IsString()
  Consideraciones?: string;

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
