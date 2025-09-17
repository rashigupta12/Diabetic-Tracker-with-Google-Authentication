// app/api/dashboard/stats/route.ts
import { db } from '@/db';
import {
  bloodPressureReadings,
  bloodSugarReadings,
  medicationLogs,
  medications,
  weightReadings
} from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, avg, count, desc, eq, gte, lt, max, min } from 'drizzle-orm';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
   const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session?.user.id)
    
    // Get date ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Blood Sugar Stats
    const [bloodSugarStats] = await db
      .select({
        totalReadings: count(),
        avgGlucose: avg(bloodSugarReadings.glucose),
        minGlucose: min(bloodSugarReadings.glucose),
        maxGlucose: max(bloodSugarReadings.glucose),
      })
      .from(bloodSugarReadings)
      .where(
        and(
          eq(bloodSugarReadings.userId, userId),
          gte(bloodSugarReadings.readingTime, monthAgo)
        )
      );

    // Recent Blood Sugar Reading
    const [recentBloodSugar] = await db
      .select()
      .from(bloodSugarReadings)
      .where(eq(bloodSugarReadings.userId, userId))
      .orderBy(desc(bloodSugarReadings.readingTime))
      .limit(1);

    // Today's Blood Sugar Readings
    const todayBloodSugar = await db
      .select()
      .from(bloodSugarReadings)
      .where(
        and(
          eq(bloodSugarReadings.userId, userId),
          gte(bloodSugarReadings.readingTime, today),
          lt(bloodSugarReadings.readingTime, tomorrow)
        )
      )
      .orderBy(desc(bloodSugarReadings.readingTime));

    // Medication Stats
    const [medicationStats] = await db
      .select({
        totalMedications: count(),
      })
      .from(medications)
      .where(
        and(
          eq(medications.userId, userId),
          eq(medications.isActive, true)
        )
      );

    // Today's Medication Logs
    const todayMedicationLogs = await db
      .select({
        medicationId: medicationLogs.medicationId,
        taken: medicationLogs.taken,
        medicationName: medications.name,
      })
      .from(medicationLogs)
      .leftJoin(medications, eq(medicationLogs.medicationId, medications.id))
      .where(
        and(
          eq(medicationLogs.userId, userId),
          gte(medicationLogs.takenAt, today),
          lt(medicationLogs.takenAt, tomorrow)
        )
      );

    // Weekly Medication Compliance
    const weeklyMedicationLogs = await db
      .select({
        taken: medicationLogs.taken,
      })
      .from(medicationLogs)
      .where(
        and(
          eq(medicationLogs.userId, userId),
          gte(medicationLogs.takenAt, weekAgo)
        )
      );

    const medicationCompliance = weeklyMedicationLogs.length > 0 
      ? (weeklyMedicationLogs.filter(log => log.taken).length / weeklyMedicationLogs.length) * 100
      : 0;

    // Recent Weight
    const [recentWeight] = await db
      .select()
      .from(weightReadings)
      .where(eq(weightReadings.userId, userId))
      .orderBy(desc(weightReadings.recordedAt))
      .limit(1);

    // Weight Trend (last 2 readings)
    const weightTrend = await db
      .select()
      .from(weightReadings)
      .where(eq(weightReadings.userId, userId))
      .orderBy(desc(weightReadings.recordedAt))
      .limit(2);

    let weightChange = null;
    if (weightTrend.length === 2) {
      const current = parseFloat(weightTrend[0].weight);
      const previous = parseFloat(weightTrend[1].weight);
      weightChange = current - previous;
    }

    // Recent Blood Pressure
    const [recentBloodPressure] = await db
      .select()
      .from(bloodPressureReadings)
      .where(eq(bloodPressureReadings.userId, userId))
      .orderBy(desc(bloodPressureReadings.recordedAt))
      .limit(1);

    // Weekly Blood Sugar Trend
    const weeklyBloodSugar = await db
      .select()
      .from(bloodSugarReadings)
      .where(
        and(
          eq(bloodSugarReadings.userId, userId),
          gte(bloodSugarReadings.readingTime, weekAgo)
        )
      )
      .orderBy(bloodSugarReadings.readingTime);

    const response = {
      bloodSugar: {
        stats: {
          totalReadings: bloodSugarStats?.totalReadings || 0,
          avgGlucose: bloodSugarStats?.avgGlucose ? Math.round(Number(bloodSugarStats.avgGlucose)) : null,
          minGlucose: bloodSugarStats?.minGlucose || null,
          maxGlucose: bloodSugarStats?.maxGlucose || null,
        },
        recent: recentBloodSugar || null,
        today: todayBloodSugar || [],
        weeklyTrend: weeklyBloodSugar || [],
      },
      medications: {
        totalActive: medicationStats?.totalMedications || 0,
        todayLogs: todayMedicationLogs || [],
        compliance: Math.round(medicationCompliance),
      },
      weight: {
        recent: recentWeight || null,
        change: weightChange,
      },
      bloodPressure: {
        recent: recentBloodPressure || null,
      },
      summary: {
        todayReadingsCount: todayBloodSugar.length,
        medicationsTakenToday: todayMedicationLogs.filter(log => log.taken).length,
        totalMedicationsToday: todayMedicationLogs.length,
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}