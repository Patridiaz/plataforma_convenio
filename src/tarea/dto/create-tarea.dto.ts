// src/indicador/dto/create-tarea.dto.ts
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateTareaDto {
  @IsString()
  descripcion: string;

  @IsDateString()
  plazo: string; // ← DEBE ser string

  @IsOptional()
  @IsDateString()
  cumplimiento?: string; // ← también corregido

  @IsOptional()
  @IsString()
  evidencias?: string;

  @IsOptional()
  @IsString()
  eval?: string;

  @IsOptional()
  @IsString()
  obs?: string;
}
