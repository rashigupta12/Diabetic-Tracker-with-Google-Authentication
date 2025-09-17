// app/api/dashboard/charts/blood-pressure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bloodPressureReadings } from '@/db/schema';
import { eq, and, gte, avg, min, max, count, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
  const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const groupBy = searchParams.get('groupBy') || 'day'; // 'day' or 'week'

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all readings within the date range
    const rawReadings = await db
      .select()
      .from(bloodPressureReadings)
      .where(
        and(
          eq(bloodPressureReadings.userId, Number(session?.user.id)),
          gte(bloodPressureReadings.recordedAt, startDate)
        )
      )
      .orderBy(bloodPressureReadings.recordedAt);

    // Get stats for the period
    const [stats] = await db
      .select({
        count: count(),
        avgSystolic: avg(bloodPressureReadings.systolic),
        avgDiastolic: avg(bloodPressureReadings.diastolic),
        minSystolic: min(bloodPressureReadings.systolic),
        maxSystolic: max(bloodPressureReadings.systolic),
        minDiastolic: min(bloodPressureReadings.diastolic),
        maxDiastolic: max(bloodPressureReadings.diastolic),
        avgPulse: avg(bloodPressureReadings.pulse),
      })
      .from(bloodPressureReadings)
      .where(
        and(
          eq(bloodPressureReadings.userId, Number(session?.user.id)),
          gte(bloodPressureReadings.recordedAt, startDate)
        )
      );

    // Helper function to format date based on grouping
    const formatDateKey = (date: Date) => {
      const d = new Date(date);
      if (groupBy === 'week') {
        // Get the start of the week (Sunday)
        const day = d.getDay();
        const diff = d.getDate() - day;
        const weekStart = new Date(d.setDate(diff));
        return weekStart.toISOString().split('T')[0];
      }
      return d.toISOString().split('T')[0];
    };

    // Group readings by date (or week)
    const groupedData: {
      [key: string]: {
        systolic: number[];
        diastolic: number[];
        pulse: number[];
        recordedAt: Date;
      };
    } = {};

    rawReadings.forEach(reading => {
      const dateKey = formatDateKey(reading.recordedAt);
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          systolic: [],
          diastolic: [],
          pulse: [],
          recordedAt: reading.recordedAt,
        };
      }
      
      groupedData[dateKey].systolic.push(reading.systolic);
      groupedData[dateKey].diastolic.push(reading.diastolic);
      if (reading.pulse) {
        groupedData[dateKey].pulse.push(reading.pulse);
      }
    });

    // Convert to chart format with averages
    const chartData = Object.entries(groupedData).map(([date, data]) => {
      const systolicAvg = data.systolic.reduce((sum, val) => sum + val, 0) / data.systolic.length;
      const diastolicAvg = data.diastolic.reduce((sum, val) => sum + val, 0) / data.diastolic.length;
      const pulseAvg = data.pulse.length > 0 
        ? data.pulse.reduce((sum, val) => sum + val, 0) / data.pulse.length 
        : null;

      return {
        date,
        systolic: Math.round(systolicAvg),
        diastolic: Math.round(diastolicAvg),
        pulse: pulseAvg ? Math.round(pulseAvg) : null,
        count: data.systolic.length,
        recordedAt: data.recordedAt.toISOString(),
      };
    });

    // Sort by date
    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get recent reading
    const [recentReading] = await db
      .select()
      .from(bloodPressureReadings)
      .where(eq(bloodPressureReadings.userId, Number(session?.user.id)))
      .orderBy(desc(bloodPressureReadings.recordedAt))
      .limit(1);

    const responseData = {
      data: chartData,
      stats: {
        count: stats.count || 0,
        avgSystolic: stats.avgSystolic ? Math.round(Number(stats.avgSystolic)) : null,
        avgDiastolic: stats.avgDiastolic ? Math.round(Number(stats.avgDiastolic)) : null,
        minSystolic: stats.minSystolic || null,
        maxSystolic: stats.maxSystolic || null,
        minDiastolic: stats.minDiastolic || null,
        maxDiastolic: stats.maxDiastolic || null,
        avgPulse: stats.avgPulse ? Math.round(Number(stats.avgPulse)) : null,
      },
      recentReading: recentReading || null,
      meta: {
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
        groupBy,
        days,
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching blood pressure chart data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}