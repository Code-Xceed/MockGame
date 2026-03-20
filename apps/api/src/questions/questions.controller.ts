import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { QuestionsService } from './questions.service';
import {
  CreateQuestionDto,
  QuestionQueryDto,
  UpdateQuestionDto,
} from './dto/question.dto';

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a question (admin)' })
  create(@Body() body: CreateQuestionDto) {
    return this.questionsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List questions with cursor pagination' })
  findAll(@Query() query: QuestionQueryDto) {
    return this.questionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a question (admin)' })
  update(@Param('id') id: string, @Body() body: UpdateQuestionDto) {
    return this.questionsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a question (admin)' })
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
