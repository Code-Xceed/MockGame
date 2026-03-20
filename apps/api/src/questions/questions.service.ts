import { Injectable, NotFoundException } from '@nestjs/common';
import { ExamTrack, Subject, Difficulty } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

const PAGE_SIZE = 20;

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateQuestionDto) {
    return this.prisma.question.create({ data: input });
  }

  async findAll(filters: {
    examTrack?: ExamTrack;
    subject?: Subject;
    difficulty?: Difficulty;
    cursor?: string;
  }) {
    const where = {
      ...(filters.examTrack && { examTrack: filters.examTrack }),
      ...(filters.subject && { subject: filters.subject }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      isActive: true,
    };

    const items = await this.prisma.question.findMany({
      where,
      take: PAGE_SIZE + 1,
      ...(filters.cursor && {
        cursor: { id: filters.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = items.length > PAGE_SIZE;
    const data = hasMore ? items.slice(0, PAGE_SIZE) : items;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async findById(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async update(id: string, input: UpdateQuestionDto) {
    await this.findById(id); // ensures exists
    return this.prisma.question.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /** Pick N random questions for a match (used by battle system) */
  async pickForMatch(examTrack: ExamTrack, count = 3) {
    // Simple random selection using orderBy with random-ish approach
    const total = await this.prisma.question.count({
      where: { examTrack, isActive: true },
    });

    if (total === 0) return [];

    const skip = Math.max(0, Math.floor(Math.random() * (total - count)));

    return this.prisma.question.findMany({
      where: { examTrack, isActive: true },
      take: count,
      skip,
      select: {
        id: true,
        examTrack: true,
        subject: true,
        difficulty: true,
        body: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        // NOTE: correctOption is NOT sent to clients during battle
      },
    });
  }
}
