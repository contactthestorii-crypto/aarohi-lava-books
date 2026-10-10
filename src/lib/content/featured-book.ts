// Facts transcribed from the Target Police cover (the only source provided). Used for the
// homepage showcase when the catalog is not connected or the book has no data yet. The same
// facts are seeded into the database (supabase/migrations/..._seed_initial_data.sql);
// once connected, the admin-edited product data takes over.

export const FEATURED_BOOK = {
  slug: "target-police-general-studies-tslprb-tgpsc",
  brand: "Target Police",
  title: "360° Explanation of General Studies",
  subtitle: "Previous Question Papers",
  scope: "All Telangana Sub Inspector previous papers (Prelims & Mains), explained in 360°",
  exams: ["UPSC", "TGPSC", "TSLPRB", "APPSC", "OTHER STATE EXAMS"],
  examNote: "and other state & central competitive exams",
  edition: "Updated with 2026 data",
  author: "Swathylava Neralla",
  authorQualification: "MSc, MA",
  publisher: "Aarohi Lava Publications",
  highlights: [
    { title: "All SI previous papers", body: "Telangana Sub Inspector Prelims & Mains papers, explained in 360°" },
    { title: "Complete syllabus coverage", body: "Covered with an exam-oriented 360° approach" },
    { title: "Budgets 2026-27", body: "Central & State budgets with key highlights and probable questions" },
    { title: "Socio Economic Survey 2026", body: "Telangana survey with charts, facts and analysis" },
    { title: "2026 awards", body: "Nobel, Padma, Gaddar and other important awards" },
    { title: "Linked to current affairs", body: "Reports, surveys, indexes, schemes and committees" },
    { title: "Saves time", body: "Concise, exam-oriented explanations" },
    { title: "Topic-wise previous questions", body: "Read one topic and answer every type of question on it" },
    { title: "Concept clarity", body: "Tables, maps, diagrams and PYQ trends" },
    { title: "Beyond one exam", body: "Useful for UPSC, TGPSC, TSLPRB, APPSC and other state & central exams" },
  ],
  subjects: [
    "Indian Polity",
    "Indian Economy",
    "Telangana Economy",
    "Indian History",
    "Telangana History",
    "Telangana Movement",
    "World, Indian & Telangana Geography",
    "Science and Technology",
    "Environmental Science",
    "Sociology",
    "Current Affairs",
  ],
} as const;
