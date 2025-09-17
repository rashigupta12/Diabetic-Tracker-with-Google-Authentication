// app/api/dashboard/charts/weight/route.ts
import { db } from '@/db';
import { weightReadings } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq, gte } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await db
      .select()
      .from(weightReadings)
      .where(
        and(
          eq(weightReadings.userId, Number(session?.user.id)),
          gte(weightReadings.recordedAt, startDate)
        )
      )
      .orderBy(weightReadings.recordedAt);

    const chartData = readings.map(reading => ({
      date: reading.recordedAt.toISOString().split('T')[0],
      weight: parseFloat(reading.weight),
    }));

    return NextResponse.json({
      data: chartData,
      totalReadings: readings.length,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      }
    });
  } catch (error) {
    console.error('Error fetching weight chart data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}