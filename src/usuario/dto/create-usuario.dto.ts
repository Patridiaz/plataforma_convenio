// src/usuario/dto/create-usuario.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsIn, IsNumber } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  @IsIn(['admin', 'sostenedor', 'director'])
  rol?: string;

  @IsNumber()
  establecimientoId: number;  // Obligatorio que el usuario tenga establecimiento
}
