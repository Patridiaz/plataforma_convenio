import { Body, Controller, Post } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Controller('usuario')
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

  @Post('registro')
  async register(@Body() body: CreateUsuarioDto) {
    return this.usuarioService.crearUsuario(body);
  }
    
}
