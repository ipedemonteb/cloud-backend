import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return {
      user,
      message: "Estas autenticado con Cognito"
    };
  }
}
