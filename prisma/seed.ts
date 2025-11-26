
import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Subjects
  const physics = await prisma.subject.upsert({
    where: { name: 'Physics' },
    update: {},
    create: { name: 'Physics', code: 'PHY' },
  });

  const chemistry = await prisma.subject.upsert({
    where: { name: 'Chemistry' },
    update: {},
    create: { name: 'Chemistry', code: 'CHEM' },
  });

  const math = await prisma.subject.upsert({
    where: { name: 'Mathematics' },
    update: {},
    create: { name: 'Mathematics', code: 'MATH' },
  });

  console.log('Subjects created/verified.');

  // Create Chapters
  const mechanics = await prisma.chapter.upsert({
    where: { subjectId_code: { subjectId: physics.id, code: 'PHY-01' } },
    update: {},
    create: {
      subjectId: physics.id,
      name: 'Mechanics',
      code: 'PHY-01',
    },
  });

  const organicChem = await prisma.chapter.upsert({
    where: { subjectId_code: { subjectId: chemistry.id, code: 'CHEM-01' } },
    update: {},
    create: {
      subjectId: chemistry.id,
      name: 'Organic Chemistry',
      code: 'CHEM-01',
    },
  });

    const calculus = await prisma.chapter.upsert({
    where: { subjectId_code: { subjectId: math.id, code: 'MATH-01' } },
    update: {},
    create: {
      subjectId: math.id,
      name: 'Calculus',
      code: 'MATH-01',
    },
  });

  console.log('Chapters created/verified.');

  // Create Questions
  await prisma.question.upsert({
    where: { id: 'seed-question-1' },
    update: {},
    create: {
      id: 'seed-question-1',
      subjectId: physics.id,
      chapterId: mechanics.id,
      questionText: 'What is the law of conservation of energy?',
      option1: 'Energy cannot be created or destroyed',
      option2: 'Energy can be created and destroyed',
      option3: 'Energy is always increasing',
      option4: 'Energy is always decreasing',
      correctOption: 1,
      difficulty: Difficulty.EASY,
      marks: 4,
      negativeMarks: 1,
    },
  });

  await prisma.question.upsert({
    where: { id: 'seed-question-2' },
    update: {},
    create: {
      id: 'seed-question-2',
      subjectId: chemistry.id,
      chapterId: organicChem.id,
      questionText: 'What is the main component of natural gas?',
      option1: 'Butane',
      option2: 'Propane',
      option3: 'Methane',
      option4: 'Ethane',
      correctOption: 3,
      difficulty: Difficulty.MEDIUM,
      marks: 4,
      negativeMarks: 1,
    },
  });

    await prisma.question.upsert({
    where: { id: 'seed-question-3' },
    update: {},
    create: {
      id: 'seed-question-3',
      subjectId: math.id,
      chapterId: calculus.id,
      questionText: 'What is the integral of 1/x?',
      option1: 'ln(x)',
      option2: 'x^2',
      option3: '1/x^2',
      option4: 'e^x',
      correctOption: 1,
      difficulty: Difficulty.MEDIUM,
      marks: 4,
      negativeMarks: 1,
    },
  });


  console.log('Sample questions created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
