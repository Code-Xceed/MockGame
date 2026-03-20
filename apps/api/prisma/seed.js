const bcrypt = require('bcryptjs');
const { PrismaClient, ExamTrack } = require('@prisma/client');

const prisma = new PrismaClient();

const seedUsers = [
  {
    email: 'admin@mockgame.dev',
    password: 'Admin@123',
    displayName: 'MockGame Admin',
    role: 'ADMIN',
    examTrack: ExamTrack.JEE_MAIN,
  },
  {
    email: 'player1@mockgame.dev',
    password: 'Player@123',
    displayName: 'Player One',
    role: 'STUDENT',
    examTrack: ExamTrack.JEE_MAIN,
  },
  {
    email: 'player2@mockgame.dev',
    password: 'Player@123',
    displayName: 'Player Two',
    role: 'STUDENT',
    examTrack: ExamTrack.BITSAT,
  },
];

const seedQuestions = [
  {
    examTrack: ExamTrack.JEE_MAIN,
    subject: 'PHYSICS',
    difficulty: 'EASY',
    body: 'A body of mass 2 kg is thrown vertically upward with a velocity of 20 m/s. What is the maximum height reached? (g = 10 m/s²)',
    optionA: '10 m',
    optionB: '20 m',
    optionC: '30 m',
    optionD: '40 m',
    correctOption: 'B',
    explanation: 'Using v² = u² - 2gh, 0 = 400 - 2×10×h, h = 20 m',
  },
  {
    examTrack: ExamTrack.JEE_MAIN,
    subject: 'CHEMISTRY',
    difficulty: 'MEDIUM',
    body: 'Which of the following is the strongest acid?',
    optionA: 'HF',
    optionB: 'HCl',
    optionC: 'HBr',
    optionD: 'HI',
    correctOption: 'D',
    explanation: 'Bond strength decreases down the group, making HI the strongest acid.',
  },
  {
    examTrack: ExamTrack.JEE_MAIN,
    subject: 'MATHEMATICS',
    difficulty: 'EASY',
    body: 'The value of sin²(30°) + cos²(30°) is:',
    optionA: '0',
    optionB: '1',
    optionC: '½',
    optionD: '√3/2',
    correctOption: 'B',
    explanation: 'By the Pythagorean identity: sin²θ + cos²θ = 1 for all θ.',
  },
  {
    examTrack: ExamTrack.JEE_MAIN,
    subject: 'PHYSICS',
    difficulty: 'MEDIUM',
    body: 'Two capacitors of 3μF and 6μF are connected in series. The equivalent capacitance is:',
    optionA: '9 μF',
    optionB: '2 μF',
    optionC: '3 μF',
    optionD: '1 μF',
    correctOption: 'B',
    explanation: '1/C = 1/3 + 1/6 = 3/6 = 1/2, so C = 2μF',
  },
  {
    examTrack: ExamTrack.JEE_MAIN,
    subject: 'MATHEMATICS',
    difficulty: 'HARD',
    body: 'The number of solutions of the equation |x|² - 3|x| + 2 = 0 is:',
    optionA: '1',
    optionB: '2',
    optionC: '3',
    optionD: '4',
    correctOption: 'D',
    explanation: 'Let t = |x|. t² - 3t + 2 = 0 gives t = 1, 2. Each gives two solutions: x = ±1, ±2. Total = 4.',
  },
  {
    examTrack: ExamTrack.JEE_MAIN,
    subject: 'CHEMISTRY',
    difficulty: 'HARD',
    body: 'The hybridization of carbon in CO₂ is:',
    optionA: 'sp',
    optionB: 'sp²',
    optionC: 'sp³',
    optionD: 'sp³d',
    correctOption: 'A',
    explanation: 'CO₂ is linear with two double bonds, requiring sp hybridization.',
  },
  {
    examTrack: ExamTrack.BITSAT,
    subject: 'PHYSICS',
    difficulty: 'EASY',
    body: 'The SI unit of electric current is:',
    optionA: 'Volt',
    optionB: 'Ohm',
    optionC: 'Ampere',
    optionD: 'Watt',
    correctOption: 'C',
    explanation: 'Ampere (A) is the SI unit of electric current.',
  },
  {
    examTrack: ExamTrack.BITSAT,
    subject: 'MATHEMATICS',
    difficulty: 'MEDIUM',
    body: 'If log₂(x) = 5, then x =',
    optionA: '10',
    optionB: '25',
    optionC: '32',
    optionD: '64',
    correctOption: 'C',
    explanation: '2⁵ = 32',
  },
  {
    examTrack: ExamTrack.BITSAT,
    subject: 'CHEMISTRY',
    difficulty: 'EASY',
    body: 'The atomic number of Sodium is:',
    optionA: '10',
    optionB: '11',
    optionC: '12',
    optionD: '23',
    correctOption: 'B',
    explanation: 'Sodium (Na) has atomic number 11.',
  },
];

async function main() {
  console.log('🌱 Seeding users...');
  for (const item of seedUsers) {
    const hash = await bcrypt.hash(item.password, 10);
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        displayName: item.displayName,
        passwordHash: hash,
        role: item.role,
        examTrack: item.examTrack,
        timezone: 'Asia/Kolkata',
        region: 'IN',
      },
      create: {
        email: item.email,
        passwordHash: hash,
        displayName: item.displayName,
        role: item.role,
        examTrack: item.examTrack,
        timezone: 'Asia/Kolkata',
        region: 'IN',
      },
    });

    await prisma.rating.upsert({
      where: {
        userId_examTrack: {
          userId: user.id,
          examTrack: item.examTrack,
        },
      },
      update: {},
      create: {
        userId: user.id,
        examTrack: item.examTrack,
        hiddenMmr: 1200,
        visibleTier: 'Bronze',
        matchesPlayed: 0,
      },
    });

    console.log(`  ✓ ${item.role}: ${item.email}`);
  }

  console.log('📝 Seeding questions...');
  for (const q of seedQuestions) {
    await prisma.question.create({ data: q });
  }
  console.log(`  ✓ ${seedQuestions.length} questions seeded`);

  console.log('✅ Seed complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
