// One-off seed script: populates ~8 sample professors so the Professors tab
// isn't empty on first load. Idempotent — wipes the collection and re-inserts.
// Run with:  node seed-professors.js
require('dotenv').config();
const mongoose = require('mongoose');
const Professor = require('./src/models/Professor');

// joiningDate derived from years of experience (relative to 2026).
const joined = (yearsAgo) => new Date(2026 - yearsAgo, 7, 1); // Aug 1 of that year

const professors = [
    { name: 'Dr. Ananya Sharma',   employeeId: 'EMP101', email: 'ananya.sharma@acme.edu',    department: 'Computer Science', designation: 'Professor',            gender: 'female', specialization: 'Machine Learning',         experience: 14, phone: '9876500101', joiningDate: joined(14) },
    { name: 'Dr. Rohan Mehta',     employeeId: 'EMP102', email: 'rohan.mehta@acme.edu',      department: 'Mathematics',      designation: 'Associate Professor',  gender: 'male',   specialization: 'Number Theory',            experience: 9,  phone: '9876500102', joiningDate: joined(9) },
    { name: 'Dr. Priya Nair',      employeeId: 'EMP103', email: 'priya.nair@acme.edu',       department: 'Physics',          designation: 'Assistant Professor',  gender: 'female', specialization: 'Quantum Computing',        experience: 5,  phone: '9876500103', joiningDate: joined(5) },
    { name: 'Dr. Arjun Verma',     employeeId: 'EMP104', email: 'arjun.verma@acme.edu',      department: 'Chemistry',        designation: 'Professor',            gender: 'male',   specialization: 'Organic Chemistry',        experience: 20, phone: '9876500104', joiningDate: joined(20) },
    { name: 'Dr. Kavya Iyer',      employeeId: 'EMP105', email: 'kavya.iyer@acme.edu',       department: 'English',          designation: 'Lecturer',             gender: 'female', specialization: 'Postcolonial Literature',  experience: 3,  phone: '9876500105', joiningDate: joined(3) },
    { name: 'Dr. Siddharth Rao',   employeeId: 'EMP106', email: 'siddharth.rao@acme.edu',    department: 'Computer Science', designation: 'Associate Professor',  gender: 'male',   specialization: 'Distributed Systems',      experience: 11, phone: '9876500106', joiningDate: joined(11) },
    { name: 'Dr. Meera Joshi',     employeeId: 'EMP107', email: 'meera.joshi@acme.edu',      department: 'Biology',          designation: 'Assistant Professor',  gender: 'female', specialization: 'Genetics',                 experience: 6,  phone: '9876500107', joiningDate: joined(6) },
    { name: 'Dr. Vikram Singh',    employeeId: 'EMP108', email: 'vikram.singh@acme.edu',     department: 'Mathematics',      designation: 'Professor',            gender: 'male',   specialization: 'Applied Statistics',       experience: 17, phone: '9876500108', joiningDate: joined(17) },
];

// Generate additional professors so multi-select / bulk delete (and pagination)
// have plenty to work with — keeps the 8 named ones above.
const EXTRA = 32;
const first = ['Rahul', 'Neha', 'Amit', 'Sneha', 'Karan', 'Pooja', 'Manish', 'Divya', 'Suresh', 'Ritu',
  'Vinod', 'Asha', 'Deepak', 'Geeta', 'Nikhil', 'Sunita'];
const last = ['Sharma', 'Verma', 'Nair', 'Iyer', 'Rao', 'Joshi', 'Singh', 'Mehta', 'Gupta', 'Reddy', 'Kapoor', 'Das'];
const departments = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Economics'];
const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];
const specializations = ['Algorithms', 'Topology', 'Astrophysics', 'Polymer Science', 'Microbiology', 'Linguistics', 'Medieval History', 'Macroeconomics'];
const genders = ['male', 'female', 'other'];

for (let i = 0; i < EXTRA; i++) {
    const f = first[i % first.length];
    const l = last[(i * 5) % last.length];
    const exp = (i % 25) + 1;
    professors.push({
        name: `Dr. ${f} ${l}`,
        employeeId: `EMP${200 + i}`,
        email: `${f}.${l}${i}@acme.edu`.toLowerCase(),
        department: departments[i % departments.length],
        designation: designations[i % designations.length],
        gender: genders[i % genders.length],
        specialization: specializations[i % specializations.length],
        experience: exp,
        phone: `9${String(870000000 + i)}`,
        joiningDate: joined(exp),
    });
}

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MONGODB connected');

    await Professor.deleteMany({});
    const inserted = await Professor.insertMany(professors);
    console.log(`Seeded ${inserted.length} professors`);

    // Bust the Redis list cache so the freshly-seeded data shows immediately
    // (rather than waiting out the 60s TTL on a stale/empty entry). Optional —
    // the seed still succeeds if Redis is unreachable.
    try {
        const redis = require('./src/config/redis');
        if (!redis.isOpen) await redis.connect();
        const keys = await redis.keys('professors:*');
        if (keys.length) await redis.del(keys);
        await redis.quit();
        console.log('Cleared professors cache');
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
