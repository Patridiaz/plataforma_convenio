// src/indicador/dto/create-tarea.dto.ts
import { Transform } from 'class-transformer';
import { IsString, IsDateString, IsOptional } from 'class-validator';

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
