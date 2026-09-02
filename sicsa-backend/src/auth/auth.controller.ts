import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthRateLimitService } from './security/auth-rate-limit.service';
import { getAuthRateLimitConfig } from '../config/environment';
import { PhoneRegistrationService } from './phone-registration.service';
import {
  ResendPhoneRegistrationDto,
  VerifyPhoneRegistrationDto,
} from './dto/verify-phone-registration.dto';
import {
  RequestPhonePasswordRecoveryDto,
  ResetPasswordByPhoneDto,
  VerifyPhonePasswordRecoveryDto,
} from './dto/phone-password-recovery.dto';
import { PhonePasswordRecoveryService } from './phone-password-recovery.service';
import { CompleteMfaDto, RegenerateRecoveryCodesDto } from './dto/mfa.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { AuditService } from '../audit/audit.service';

const rateLimit = getAuthRateLimitConfig();

const loginThrottle = {
  short: { limit: 10, ttl: 60_000 },
  long: {
    limit: rateLimit.generalIpLimit,
    ttl: rateLimit.loginWindowMs,
  },
};

const codeDeliveryThrottle = {
  short: { limit: 5, ttl: 60_000 },
  long: {
    limit: rateLimit.generalIpLimit,
    ttl: rateLimit.loginWindowMs,
  },
};

const codeVerificationThrottle = {
  short: { limit: 5, ttl: 60_000 },
  long: {
    limit: rateLimit.codeMaxAttempts,
    ttl: rateLimit.loginWindowMs,
  },
};

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authRateLimitService: AuthRateLimitService,
    private readonly phoneRegistrationService: PhoneRegistrationService,
    private readonly phonePasswordRecoveryService: PhonePasswordRecoveryService,
    private readonly audit: AuditService,
  ) {}

  @Post('register')
  @Throttle({
    short: { limit: 2, ttl: 60_000 },
    long: { limit: 5, ttl: rateLimit.loginWindowMs },
  })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('register/phone')
  @Throttle(codeDeliveryThrottle)
  registerByPhone(@Body() body: RegisterDto, @Req() request: Request) {
    return this.phoneRegistrationService.start(body, this.requestIp(request));
  }

  @Post('register/phone/verify')
  @Throttle(codeVerificationThrottle)
  verifyPhoneRegistration(@Body() body: VerifyPhoneRegistrationDto) {
    return this.phoneRegistrationService.verify(
      body.registrationId,
      body.challengeId,
      body.code,
    );
  }

  @Post('register/phone/resend')
  @Throttle(codeDeliveryThrottle)
  resendPhoneRegistration(
    @Body() body: ResendPhoneRegistrationDto,
    @Req() request: Request,
  ) {
    return this.phoneRegistrationService.resend(
      body.registrationId,
      this.requestIp(request),
    );
  }

  @Post('login')
  @Throttle(loginThrottle)
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const identifier = this.authRateLimitService.normalizeIdentifier(
      body.email,
    );
    const existingRetryAfter =
      this.authRateLimitService.getLoginRetryAfterSeconds(ip, identifier);

    if (existingRetryAfter > 0) {
      response.setHeader('Retry-After', existingRetryAfter.toString());
      throw this.tooManyRequests();
    }

    try {
      const result = await this.authService.login(identifier, body.password);
      this.authRateLimitService.clearLoginFailures(ip, identifier);
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        await this.audit.record({
          actorRole: 'unknown',
          action: 'auth.login_failed',
          resourceType: 'authentication',
          result: 'failure',
        });
        const retryAfter = this.authRateLimitService.recordLoginFailure(
          ip,
          identifier,
        );

        if (retryAfter > 0) {
          response.setHeader('Retry-After', retryAfter.toString());
          throw this.tooManyRequests();
        }
      }

      throw error;
    }
  }

  @Post('send-verification-code')
  @Throttle(codeDeliveryThrottle)
  sendVerificationCode(
    @Body() body: SendVerificationCodeDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.enforceDeliveryCooldown(
      'send-verification-code',
      request,
      response,
      body.email,
    );
    return this.authService.sendVerificationCode(body.email);
  }

  @Post('mfa/complete')
  @Throttle({
    short: { limit: 5, ttl: 5 * 60_000 },
    long: { limit: 10, ttl: 15 * 60_000 },
  })
  async completeMfa(@Body() body: CompleteMfaDto) {
    const result = await this.authService.completeMfaLogin(
      body.challengeToken,
      body.method,
      body.code,
    );
    await this.audit.record({
      actorUserId: result.user.id,
      actorRole: result.user.role,
      action: result.recoveryCodes
        ? 'mfa.enrolled'
        : 'auth.privileged_login_succeeded',
      resourceType: 'user',
      resourceId: result.user.id,
      result: 'success',
      metadata: { method: body.method },
    });
    return result;
  }

  @Post('mfa/recovery-codes/regenerate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('doctor', 'admin')
  @Throttle({
    short: { limit: 3, ttl: 5 * 60_000 },
    long: { limit: 5, ttl: 60 * 60_000 },
  })
  async regenerateRecoveryCodes(
    @Req() request: Request & { user: { sub: number; role: string } },
    @Body() body: RegenerateRecoveryCodesDto,
  ) {
    const result = await this.authService.regenerateRecoveryCodes(
      request.user.sub,
      body.code,
    );
    await this.audit.record({
      actorUserId: request.user.sub,
      actorRole: request.user.role,
      action: 'mfa.recovery_codes_regenerated',
      resourceType: 'user',
      resourceId: request.user.sub,
      result: 'success',
    });
    return result;
  }

  @Post('verify-email-code')
  @Throttle(codeVerificationThrottle)
  verifyEmailCode(@Body() body: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(body.email, body.code);
  }

  @Post('forgot-password')
  @Throttle(codeDeliveryThrottle)
  forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.enforceDeliveryCooldown(
      'forgot-password',
      request,
      response,
      body.email,
    );
    return this.authService.forgotPassword(body.email);
  }

  @Post('forgot-password/phone')
  @Throttle(codeDeliveryThrottle)
  forgotPasswordByPhone(
    @Body() body: RequestPhonePasswordRecoveryDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.enforceDeliveryCooldown(
      'forgot-password-phone',
      request,
      response,
      body.phone,
    );
    return this.phonePasswordRecoveryService.request(
      body.phone,
      this.requestIp(request),
    );
  }

  @Post('verify-reset-code')
  @Throttle(codeVerificationThrottle)
  verifyResetCode(@Body() body: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(body.email, body.code);
  }

  @Post('verify-reset-code/phone')
  @Throttle(codeVerificationThrottle)
  verifyResetCodeByPhone(@Body() body: VerifyPhonePasswordRecoveryDto) {
    return this.phonePasswordRecoveryService.verify(
      body.phone,
      body.challengeId,
      body.code,
    );
  }

  @Post('reset-password')
  @Throttle({
    short: { limit: 3, ttl: 60_000 },
    long: { limit: 5, ttl: rateLimit.loginWindowMs },
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    const result = await this.authService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
      body.confirmPassword,
    );
    await this.audit.record({
      actorRole: 'unknown',
      action: 'auth.password_reset_completed',
      resourceType: 'authentication',
      result: 'success',
      metadata: { channel: 'email' },
    });
    return result;
  }

  @Post('reset-password/phone')
  @Throttle({
    short: { limit: 3, ttl: 60_000 },
    long: { limit: 5, ttl: rateLimit.loginWindowMs },
  })
  async resetPasswordByPhone(@Body() body: ResetPasswordByPhoneDto) {
    const result = await this.phonePasswordRecoveryService.reset(
      body.phone,
      body.resetToken,
      body.newPassword,
      body.confirmPassword,
    );
    await this.audit.record({
      actorRole: 'patient',
      action: 'auth.password_reset_completed',
      resourceType: 'authentication',
      result: 'success',
      metadata: { channel: 'phone' },
    });
    return result;
  }

  private tooManyRequests(): HttpException {
    return new HttpException(
      'Demasiadas solicitudes. Intenta nuevamente más tarde.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private requestIp(request: Request): string {
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private enforceDeliveryCooldown(
    action: string,
    request: Request,
    response: Response,
    identifier: string,
  ): void {
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const retryAfter = this.authRateLimitService.consumeIdentifierCooldown(
      action,
      ip,
      identifier,
    );

    if (retryAfter > 0) {
      response.setHeader('Retry-After', retryAfter.toString());
      throw this.tooManyRequests();
    }
  }
}
