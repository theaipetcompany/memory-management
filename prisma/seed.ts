import prisma from '@/lib/db';

const main = async () => {
  console.log('Seeding database...');
  console.time('Seeding complete 🌱');

  // Add any necessary seed data here
  // For now, we'll just clear any existing data if needed

  console.timeEnd('Seeding complete 🌱');
};

main()
  .then(() => {
    console.log('Process completed');
  })
  .catch((e) => console.log(e));
