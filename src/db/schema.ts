import { pgTable, serial, integer, timestamp, text, decimal, boolean, pgEnum, varchar, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 50 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }), // nullable for OAuth users
  name: varchar({ length: 255 }),
  image: varchar({ length: 500 }),
  emailVerified: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const accountsTable = pgTable("accounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: varchar({ length: 255 }).notNull(),
  provider: varchar({ length: 255 }).notNull(),
  providerAccountId: varchar({ length: 255 }).notNull(),
  refreshToken: text(), // Changed from varchar(500) to text
  accessToken: text(), // Changed from varchar(500) to text
  expiresAt: integer(),
  tokenType: varchar({ length: 255 }),
  scope: text(), // Changed from varchar(255) to text
  idToken: text(), // Changed from varchar(500) to text
  sessionState: varchar({ length: 255 }),
  createdAt: timestamp().defaultNow().notNull(),
});

export const sessionsTable = pgTable("sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionToken: varchar({ length: 255 }).notNull().unique(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  expires: timestamp().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const verificationTokensTable = pgTable("verification_tokens", {
  identifier: varchar({ length: 255 }).notNull(),
  token: varchar({ length: 255 }).notNull().unique(),
  expires: timestamp().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});


export const mealTypeEnum = pgEnum('meal_type', [
  'before_breakfast', 
  'after_breakfast', 
  'before_lunch', 
  'after_lunch', 
  'before_dinner', 
  'after_dinner', 
  'bedtime'
]);



// User sessions table
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Simple blood sugar readings table
export const bloodSugarReadings = pgTable('blood_sugar_readings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  glucose: integer('glucose').notNull(), // mg/dL
  readingTime: timestamp('reading_time', { withTimezone: true }).defaultNow().notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  notes: text('notes'), // Optional notes
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Medication tracking (simple)
export const medications = pgTable('medications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  dosage: text('dosage').notNull(), // e.g., "10mg", "5 units"
  frequency: text('frequency').notNull(), // e.g., "Once daily", "Twice daily"
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Daily medication logs (did they take it?)
export const medicationLogs = pgTable('medication_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  medicationId: integer('medication_id').references(() => medications.id, { onDelete: 'cascade' }).notNull(),
  takenAt: timestamp('taken_at', { withTimezone: true }).defaultNow().notNull(),
  taken: boolean('taken').default(true).notNull(),
  notes: text('notes'),
});

// Simple weight tracking
export const weightReadings = pgTable('weight_readings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  weight: decimal('weight', { precision: 5, scale: 2 }).notNull(), // kg
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Blood pressure (optional, many diabetics also track this)
export const bloodPressureReadings = pgTable('blood_pressure_readings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
  systolic: integer('systolic').notNull(),
  diastolic: integer('diastolic').notNull(),
  pulse: integer('pulse'), // Optional
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  bloodSugarReadings: many(bloodSugarReadings),
  medications: many(medications),
  medicationLogs: many(medicationLogs),
  weightReadings: many(weightReadings),
  bloodPressureReadings: many(bloodPressureReadings),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessions.userId],
    references: [usersTable.id],
  }),
}));

export const bloodSugarReadingsRelations = relations(bloodSugarReadings, ({ one }) => ({
  user: one(usersTable, {
    fields: [bloodSugarReadings.userId],
    references: [usersTable.id],
  }),
}));

export const medicationsRelations = relations(medications, ({ many, one }) => ({
  logs: many(medicationLogs),
  user: one(usersTable, {
    fields: [medications.userId],
    references: [usersTable.id],
  }),
}));

export const medicationLogsRelations = relations(medicationLogs, ({ one }) => ({
  medication: one(medications, {
    fields: [medicationLogs.medicationId],
    references: [medications.id],
  }),
  user: one(usersTable, {
    fields: [medicationLogs.userId],
    references: [usersTable.id],
  }),
}));

export const weightReadingsRelations = relations(weightReadings, ({ one }) => ({
  user: one(usersTable, {
    fields: [weightReadings.userId],
    references: [usersTable.id],
  }),
}));

export const bloodPressureReadingsRelations = relations(bloodPressureReadings, ({ one }) => ({
  user: one(usersTable, {
    fields: [bloodPressureReadings.userId],
    references: [usersTable.id],
  }),
}));

// Export types for use in the app
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type BloodSugarReading = typeof bloodSugarReadings.$inferSelect;
export type NewBloodSugarReading = typeof bloodSugarReadings.$inferInsert;
export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;
export type MedicationLog = typeof medicationLogs.$inferSelect;
export type NewMedicationLog = typeof medicationLogs.$inferInsert;
export type WeightReading = typeof weightReadings.$inferSelect;
export type NewWeightReading = typeof weightReadings.$inferInsert;
export type BloodPressureReading = typeof bloodPressureReadings.$inferSelect;
export type NewBloodPressureReading = typeof bloodPressureReadings.$inferInsert;