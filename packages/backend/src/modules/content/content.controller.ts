import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ContentService } from "./content.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import {
  CreateArticleDto,
  UpdateArticleDto,
  NewsletterSubscribeDto,
  NewsletterUnsubscribeDto,
  BuyerProgramDto,
  ContactMessageDto,
  StatusUpdateDto,
} from "./dto/content.dto";

@ApiTags("Content / Public")
@Controller("content")
export class ContentController {
  constructor(private contentService: ContentService) {}

  private requireAdmin(user: any): void {
    if (
      !user?.roles?.some((r: string) =>
        ["CONTENT_MANAGER", "PLATFORM_ADMIN", "SUPER_ADMIN"].includes(r)
      )
    ) {
      throw new ForbiddenException("Content manager access required");
    }
  }

  // ---------- Public ----------
  @Public()
  @Get("articles")
  @ApiOperation({ summary: "List published articles (public)" })
  async listArticles(@Query("language") language?: string) {
    return this.contentService.findPublishedArticles(language);
  }

  @Public()
  @Get("articles/:slug")
  @ApiOperation({ summary: "Get published article by slug (public)" })
  async getArticle(@Param("slug") slug: string) {
    return this.contentService.findPublishedArticle(slug);
  }

  @Public()
  @Post("newsletter/subscribe")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Subscribe to newsletter (public)" })
  async subscribe(@Body() dto: NewsletterSubscribeDto) {
    return this.contentService.subscribe(dto.email);
  }

  @Public()
  @Post("newsletter/unsubscribe")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Unsubscribe from newsletter (public)" })
  async unsubscribe(@Body() dto: NewsletterUnsubscribeDto) {
    return this.contentService.unsubscribe(dto.email);
  }

  @Public()
  @Post("buyer-program")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register for buyer program (public)" })
  async registerBuyerProgram(@Body() dto: BuyerProgramDto) {
    return this.contentService.registerBuyerProgram(dto);
  }

  @Public()
  @Post("contact")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Submit contact inquiry (public)" })
  async submitContact(@Body() dto: ContactMessageDto) {
    return this.contentService.submitContact(dto);
  }

  // ---------- Admin ----------
  @Post("admin/articles")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create article (admin)" })
  async createArticle(@Body() dto: CreateArticleDto, @CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.contentService.createArticle(dto, user);
  }

  @Get("admin/articles")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all articles (admin)" })
  async listAllArticles(@CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.contentService.findAllArticles();
  }

  @Patch("admin/articles/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update article (admin)" })
  async updateArticle(@Param("id") id: string, @Body() dto: UpdateArticleDto, @CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.contentService.updateArticle(id, dto);
  }

  @Delete("admin/articles/:id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete article (admin)" })
  async deleteArticle(@Param("id") id: string, @CurrentUser() user: any) {
    this.requireAdmin(user);
    await this.contentService.deleteArticle(id);
  }

  @Get("admin/subscribers")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List newsletter subscribers (admin)" })
  async listSubscribers(@CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.contentService.findAllSubscribers();
  }

  @Get("admin/buyer-program")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List buyer program registrations (admin)" })
  async listBuyerProgram(@CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.contentService.findAllBuyerProgram();
  }

  @Patch("admin/buyer-program/:id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update buyer program status (admin)" })
  async updateBuyerProgramStatus(@Param("id") id: string, @Body() dto: StatusUpdateDto, @CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.contentService.updateBuyerProgramStatus(id, dto.status);
  }

  @Get("admin/contacts")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List contact messages (admin)" })
  async listContacts(@CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.contentService.findAllContacts();
  }

  @Patch("admin/contacts/:id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update contact message status (admin)" })
  async updateContactStatus(@Param("id") id: string, @Body() dto: StatusUpdateDto, @CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.contentService.updateContactStatus(id, dto.status);
  }
}