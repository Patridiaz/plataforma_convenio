import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dimension } from './dimension.entity';

@Injectable()
export class DimensionService {
  constructor(
    @InjectRepository(Dimension)
    private dimensionRepo: Repository<Dimension>,
  ) {}

  async findByConvenioId(convenioId: number): Promise<Dimension[]> {
    return this.dimensionRepo.find({
      where: { convenio: { id: convenioId } },
      relations: ['responsable'],
    });
  }
}
