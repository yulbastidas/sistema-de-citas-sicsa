import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('send-verification-code')
  sendVerificationCode(@Body() body: SendVerificationCodeDto) {
    return this.authService.sendVerificationCode(body.email);
  }

  @Post('verify-email-code')
  verifyEmailCode(@Body() body: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(body.email, body.code);
  }
}
