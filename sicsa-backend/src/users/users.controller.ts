import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';
import { parsePageRequest } from '../common/pagination';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async create(
    @Body() body: CreateUserDto,
    @Req() req: Request & { user: { sub: number; role: string } },
  ) {
    const user = await this.usersService.create(body);
    await this.audit.record({
      actorUserId: req.user.sub,
      actorRole: req.user.role,
      action: 'admin.user_created',
      resourceType: 'user',
      resourceId: user.user.id,
      result: 'success',
      metadata: { role: user.user.role },
    });
    return user;
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(parsePageRequest(page, limit), { role, search });
  }
}
