import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth-guard';

@Controller('usuario')
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

  @Post('registro')
  async register(@Body() body: CreateUsuarioDto) {
    return this.usuarioService.crearUsuario(body);
  }
    
  @Get()
  async listarUsuarios() {
    return this.usuarioService.obtenerTodos();
  }
  
  @Put(':id')
  async actualizarUsuario(@Param('id') id: number, @Body() body: Partial<CreateUsuarioDto>) {
    return this.usuarioService.actualizarUsuario(+id, body);
  }

  @Delete(':id')
  async eliminarUsuario(@Param('id') id: number) {
    return this.usuarioService.eliminarUsuario(+id);
  }

  // Ruta protegida para obtener usuarios de un establecimiento
  @Get('gestion-establecimiento/:establecimientoId')
  async listarPorEstablecimiento(@Param('establecimientoId') establecimientoId: number) {
    console.log('Recibido establecimientoId:', establecimientoId);
    return this.usuarioService.obtenerUsuariosGestionEstablecimientoPorEstablecimiento(+establecimientoId);
  }

}
