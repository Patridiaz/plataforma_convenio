import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { DimensionService } from './dimension.service';

@Controller('dimension')
export class DimensionController {
  constructor(private readonly dimensionService: DimensionService) {}

  @Get('convenio/:id')
  async getDimensionesByConvenio(@Param('id', ParseIntPipe) convenioId: number) {
    return this.dimensionService.findByConvenioId(convenioId);
  }
}
