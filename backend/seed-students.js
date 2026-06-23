// One-off seed script: populates many sample students so multi-select / bulk
// delete (and pagination) have plenty to work with. Idempotent — wipes the
// collection and re-inserts. Run with:  node seed-students.js
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');

const COUNT = 60;

const first = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Rudra',
  'Ananya', 'Diya', 'Aadhya', 'Saanvi', 'Pari', 'Ira', 'Myra', 'Aarohi', 'Anika', 'Navya'];
const last = ['Sharma', 'Verma', 'Nair', 'Iyer', 'Rao', 'Joshi', 'Singh', 'Mehta', 'Gupta', 'Reddy',
  'Kapoor', 'Bose', 'Das', 'Menon', 'Pillai'];
const genders = ['male', 'female', 'other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const sections = ['A', 'B', 'C'];

const students = Array.from({ length: COUNT }, (_, i) => {
  const f = first[i % first.length];
  const l = last[(i * 3) % last.length];
  return {
    name: `${f} ${l}`,
    rollno: `R${1001 + i}`,
    email: `${f}.${l}${i}@acme.edu`.toLowerCase(),
    grade: String((i % 12) + 1),
    phone: `9${String(800000000 + i)}`, // 10 digits
    gender: genders[i % genders.length],
    bloodGroup: bloodGroups[i % bloodGroups.length],
    section: sections[i % sections.length],
    dob: new Date(2008 - (i % 6), i % 12, ((i * 7) % 28) + 1),
    address: `${i + 1} MG Road, City ${(i % 10) + 1}`,
  };
});

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MONGODB connected');

  await Student.deleteMany({});
  const inserted = await Student.insertMany(students);
  console.log(`Seeded ${inserted.length} students`);

  try {
    const redis = require('./src/config/redis');
    if (!redis.isOpen) await redis.connect();
    const keys = await redis.keys('students:*');
    if (keys.length) await redis.del(keys);
    await redis.quit();
    console.log('Cleared students cache');
  } catch (err) {
    console.log('Skipped cache clear (Redis unavailable):', err.message);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
