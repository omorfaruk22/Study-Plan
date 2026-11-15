import type { RoutineItem, Subject } from "@/lib/types";

export const defaultSubjects: Omit<Subject, "id">[] = [
  { name: "Principles of Marketing", category: "কলেজ", code: "28551" },
  { name: "Industrial Management", category: "কলেজ", code: "28552" },
  { name: "Database Management System", category: "কলেজ", code: "28561" },
  { name: "Computer Networking", category: "কলেজ", code: "28562" },
  { name: "Sensor & IoT System", category: "কলেজ", code: "28563" },
  { name: "Microcontroller Based System Design & Development", category: "কলেজ", code: "28564" },
  { name: "Surveillance Security System", category: "কলেজ", code: "28565" },
  { name: "Web Development Project", category: "কলেজ", code: "28566" },
  ...["Chemistry", "Geometry & Calculus", "Data Communication & Networking", "Data Structure & Algorithm", "Digital Electronics", "Heat & Sound", "Physics (ভৌত)", "Algebra & Trigonometry", "English", "Light", "Operating System", "Modern Physics", "Computer Fundamentals"].map(name => ({ name, category: "DUET Non-Department" })),
  ...["Microprocessor & Microcomputer", "C Programming", "Database Management System", "DC Circuit", "Electronic Devices & Circuits", "Object Oriented Programming", "Python Programming"].map(name => ({ name, category: "DUET Department" })),
  ...["HTML & CSS", "JavaScript", "React", "Next.js", "Node.js & Express", "MongoDB", "TypeScript", "Project / Practice"].map(name => ({ name, category: "Web Development" }))
];

const routineRows = [
  ["রবিবার–বৃহস্পতিবার", "05:30", "05:50", "ঘুম থেকে ওঠা, ফজর ও প্রস্তুতি", "ব্যক্তিগত", "দিন শুরু"],
  ["রবিবার–বৃহস্পতিবার", "05:50", "07:15", "কলেজের পড়া", "কলেজ", "আগের ক্লাসের নোট ও লিখিত অনুশীলন"],
  ["রবিবার–বৃহস্পতিবার", "07:15", "08:00", "নাশতা ও কলেজের প্রস্তুতি", "ব্যক্তিগত", ""],
  ["রবিবার–বৃহস্পতিবার", "08:00", "13:00", "কলেজ ও যাতায়াত", "কলেজ", "ক্লাস রুটিন অনুযায়ী"],
  ["রবিবার–বৃহস্পতিবার", "13:00", "14:00", "খাবার ও বিশ্রাম", "ব্যক্তিগত", ""],
  ["রবিবার–বৃহস্পতিবার", "14:00", "17:00", "পার্টটাইম চাকরি", "জব", "শুক্রবার ছাড়া"],
  ["রবিবার–বৃহস্পতিবার", "17:00", "মাগরিব", "নিজের সময় ও বিশ্রাম", "ব্যক্তিগত", "নামাজসহ"],
  ["রবিবার–বৃহস্পতিবার", "মাগরিব", "19:30", "কলেজের পড়া", "কলেজ", "আজকের ক্লাসের বিষয়"],
  ["রবিবার–বৃহস্পতিবার", "20:00", "20:50", "DUET প্রস্তুতি", "DUET Non-Department", "দিনভিত্তিক বিষয়"],
  ["রবিবার–বৃহস্পতিবার", "20:50", "21:50", "Web Development", "Web Development", "প্র্যাকটিস ও প্রজেক্ট"],
  ["শুক্রবার", "15:00", "17:00", "কলেজের পড়া", "কলেজ", "সাপ্তাহিক অসমাপ্ত পড়া"],
  ["শুক্রবার", "18:30", "19:15", "DUET প্রস্তুতি", "DUET Non-Department", "গণিত / পদার্থ / কেমিস্ট্রি"],
  ["শুক্রবার", "19:15", "20:00", "DUET প্রস্তুতি", "DUET Non-Department", "রিভিশন"],
  ["শুক্রবার", "20:30", "21:30", "Web Development", "Web Development", "১ ঘণ্টা"],
  ["শনিবার", "05:50", "07:15", "কলেজের পড়া", "কলেজ", "নোট ও লিখিত অনুশীলন"],
  ["শনিবার", "07:45", "09:15", "কলেজের পড়া", "কলেজ", "কলেজের বিষয় রিভিশন"],
  ["শনিবার", "09:15", "10:15", "Web Development", "Web Development", "১ ঘণ্টা"],
  ["শনিবার", "10:15", "11:15", "DUET প্রস্তুতি", "DUET Department", "ইংরেজি / Department পালাক্রমে"],
  ["শনিবার", "14:00", "17:00", "পার্টটাইম চাকরি", "জব", ""],
  ["শনিবার", "মাগরিব", "19:00", "DUET MCQ / রিভিশন", "DUET Non-Department", "সাপ্তাহিক অনুশীলন"],
  ["শনিবার", "20:00", "21:00", "কলেজের সাপ্তাহিক পরীক্ষা", "কলেজ", "লিখিত অনুশীলন"]
] as const;

export const defaultRoutine: Omit<RoutineItem, "id">[] = routineRows.map((r, i) => ({
  day: r[0], start_time: r[1], end_time: r[2], title: r[3], category: r[4], notes: r[5], sort_order: i + 1, subject_id: null
}));
