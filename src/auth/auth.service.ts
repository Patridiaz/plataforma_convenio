// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,

  ) {}

  async validarUsuario(email: string, password: string) {
    const user = await this.usuarioService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...resto } = user;
      return resto;
    }
    throw new UnauthorizedException('Credenciales inválidas');
  }

  async login(email: string, password: string) {
    const user = await this.validarUsuario(email, password);
    const payload = { sub: user.id, email: user.email };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
