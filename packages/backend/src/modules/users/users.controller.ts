import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TenantIsolated } from "../../common/guards/abac.guard";
import { UserResponseDto } from "./dto/user.dto";

@ApiTags("Users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@TenantIsolated()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "List users (admin only)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiResponse({ status: 200, description: "Paginated user list" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async findAll(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @CurrentUser() user: any
  ) {
    if (!user.roles?.includes("SUPER_ADMIN") && !user.roles?.includes("PLATFORM_ADMIN")) {
      throw new ForbiddenException("Admin access required");
    }

    const result = await this.usersService.findAll(+page, +limit);
    return {
      ...result,
      data: result.data.map((u) => UserResponseDto.fromEntity(u)),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User found" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    if (
      user.id !== id &&
      !user.roles?.includes("SUPER_ADMIN") &&
      !user.roles?.includes("PLATFORM_ADMIN")
    ) {
      throw new ForbiddenException("Access denied");
    }

    const found = await this.usersService.findById(id);
    return UserResponseDto.fromEntity(found);
  }
}
