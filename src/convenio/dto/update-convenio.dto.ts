import { PartialType } from '@nestjs/mapped-types';
import { CreateConvenioDto } from './create-convenio.dto';

export class UpdateConvenioDto extends PartialType(CreateConvenioDto) {}
