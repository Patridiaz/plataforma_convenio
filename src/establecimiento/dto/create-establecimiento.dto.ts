import { IsNotEmpty, IsString } from "class-validator";

// src/establecimiento/dto/create-establecimiento.dto.ts
export class CreateEstablecimientoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;
}
