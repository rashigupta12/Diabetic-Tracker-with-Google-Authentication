// app/api/dashboard/charts/blood-sugar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bloodSugarReadings } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await db
      .select()
      .from(bloodSugarReadings)
      .where(
        and(
          eq(bloodSugarReadings.userId, Number(session?.user.id)),
          gte(bloodSugarReadings.readingTime, startDate)
        )
      )
      .orderBy(bloodSugarReadings.readingTime);

    // Group by date and meal type
    const groupedData: { [key: string]: { [mealType: string]: number[] } } = {};
    
    readings.forEach(reading => {
      const dateKey = reading.readingTime.toISOString().split('T')[0];
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {};
      }
      if (!groupedData[dateKey][reading.mealType]) {
        groupedData[dateKey][reading.mealType] = [];
      }
      groupedData[dateKey][reading.mealType].push(reading.glucose);
    });

    // Convert to chart format
    const chartData = Object.entries(groupedData).map(([date, mealTypes]) => {
      const dataPoint: any = { date };
      
      Object.entries(mealTypes).forEach(([mealType, values]) => {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        dataPoint[mealType] = Math.round(avg);
      });
      
      return dataPoint;
    });

    return NextResponse.json({
      data: chartData,
      totalReadings: readings.length,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      }
    });
  } catch (error) {
    console.error('Error fetching blood sugar chart data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}