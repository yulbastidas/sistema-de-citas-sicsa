import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('verify-reset-code')
  verifyResetCode(@Body() body: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(body.email, body.code);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
      body.confirmPassword,
    );
  }
}