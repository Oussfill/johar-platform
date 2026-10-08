import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CustodyService } from "./custody.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  CreateCustodyVaultDto,
  CreateCustodyTransferRequestDto,
} from "./dto/custody.dto";

@ApiTags("Custody")
@Controller("custody")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustodyController {
  constructor(private custodyService: CustodyService) {}

  private requireManager(user: any): void {
    if (
      !user?.roles?.some((r: string) =>
        ["CUSTODY_MANAGER", "ORG_ADMIN", "ORG_OWNER", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(r)
      )
    ) {
      throw new ForbiddenException("Custody manager access required");
    }
  }

  @Post("vaults")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create custody vault (org-scoped)" })
  async createVault(@Body() dto: CreateCustodyVaultDto, @CurrentUser() user: any) {
    this.requireManager(user);
    return this.custodyService.createVault(dto, user);
  }

  @Get("vaults")
  @ApiOperation({ summary: "List custody vaults" })
  async listVaults(@CurrentUser() user: any) {
    return this.custodyService.findAllVaults(user);
  }

  @Post("transfer-request")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create custody transfer request (four-eyes workflow)" })
  async createTransferRequest(@Body() dto: CreateCustodyTransferRequestDto, @CurrentUser() user: any) {
    this.requireManager(user);
    return this.custodyService.createTransferRequest(dto, user);
  }

  @Get("pending-approvals")
  @ApiOperation({ summary: "Pending custody approvals" })
  async pendingApprovals(@CurrentUser() user: any) {
    return this.custodyService.pendingApprovals(user);
  }

  @Post("approve/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve custody transfer (approver must differ from requester)" })
  async approveTransfer(@Param("id") id: string, @CurrentUser() user: any) {
    this.requireManager(user);
    return this.custodyService.approveTransfer(id, user);
  }

  @Post("reject/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reject custody transfer" })
  async rejectTransfer(@Param("id") id: string, @CurrentUser() user: any) {
    this.requireManager(user);
    return this.custodyService.rejectTransfer(id, user);
  }
}