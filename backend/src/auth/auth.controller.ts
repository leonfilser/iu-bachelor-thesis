import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /auth/refresh
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  // POST /auth/logout
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    return this.authService.logout(req.user.userId);
  }

  // GET /auth/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.authService.getMe(req.user.userId);
  }

  // PATCH /auth/me
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.authService.updateMe(req.user.userId, dto);
  }

  // DELETE /auth/me
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  deleteMe(@Req() req: any) {
    return this.authService.deleteMe(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('link-code')
  getLinkCode(@Req() req: any) {
    return this.authService.getLinkCode(req.user.userId);
  }
}
