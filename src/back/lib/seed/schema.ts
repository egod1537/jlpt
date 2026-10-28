import { z } from "zod";

const nullableString = z.string().nullable();
const sourceSchema = z.object({
  collectionId: z.string(),
  sourceType: z.enum(["attachment", "html-artifact", "conversation-recovery"]),
  sourceFile: z.string(),
  line: z.number().int().nullable(),
  year: z.number().int().nullable(),
  section: nullableString,
});

export const seedWordSchema = z.object({
  id: z.string().regex(/^word-[a-f0-9]{12}$/),
  term: z.string().min(1),
  reading: nullableString,
  meanings: z.array(z.string()),
  primaryMeaning: nullableString,
  nuance: nullableString,
  partOfSpeech: z.array(z.string()),
  jlptLevels: z.array(z.enum(["N1", "N2", "N3", "N4", "N5"])),
  years: z.array(z.number().int()),
  categories: z.array(z.string()),
  collectionIds: z.array(z.string()),
  relatedTerms: z.array(z.string()),
  examples: z.array(z.object({ ja: z.string(), ko: nullableString })),
  sources: z.array(sourceSchema),
  status: z.enum(["ready", "needs-review"]),
});

export const seedBookSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string(),
  id: z.string().regex(/^session-\d{3}$/),
  title: z.string().min(1),
  category: z.string(),
  createdAt: z.string(),
  sourceSession: z.string(),
  sourceFiles: z.array(z.unknown()),
  sourceRecordCount: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  words: z.array(seedWordSchema),
});

export const seedCollectionsSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string(),
  total: z.number().int().positive(),
  collections: z.array(z.object({
    id: z.string().regex(/^session-\d{3}$/),
    title: z.string(),
    category: z.string(),
    createdAt: z.string(),
    dataFile: z.string(),
    csvFile: z.string(),
    wordCount: z.number().int(),
    sourceRecordCount: z.number().int(),
  })),
});

export const seedStatsSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string(),
  wordbookFiles: z.number().int(),
  wordEntries: z.number().int(),
  uniqueAcrossWordbooks: z.number().int(),
  readyEntries: z.number().int(),
  needsReviewEntries: z.number().int(),
}).passthrough();

export type SeedBook = z.infer<typeof seedBookSchema>;
