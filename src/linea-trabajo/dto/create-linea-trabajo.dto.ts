import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTareaDto } from 'src/tarea/dto/create-tarea.dto';

export class CreateLineaTrabajoDto {
  @IsString()
  descripcion: string;

  @ValidateNested({ each: true })
  @Type(() => CreateTareaDto)
  tareas: CreateTareaDto[];
}
