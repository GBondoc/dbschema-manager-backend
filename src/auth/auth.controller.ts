import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

type CurrentUserType = {
  id: string;
  email: string;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(
      body.email,
      body.password,
      body.displayedName,
    );
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(
      body.email,
      body.password,
    );
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return this.auth.refresh(
      body.sessionId,
      body.refresh_token,
    );
  }

  @Post('logout')
  logout(@Body() body: LogoutDto) {
    return this.auth.logout(body.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.usersService.findPublicById(user.id);
  }
}