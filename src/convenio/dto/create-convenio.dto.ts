// src/convenio/dto/create-convenio.dto.ts
import { IsString, IsDateString, IsBoolean, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateIndicadorDto } from 'src/indicador/dto/create-indicador.dto';

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
  @Type(() => CreateIndicadorDto)
  indicadores?: CreateIndicadorDto[];
}
