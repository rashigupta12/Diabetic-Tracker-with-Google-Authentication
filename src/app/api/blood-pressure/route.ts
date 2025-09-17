/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bloodPressureReadings } from '@/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Handle single reading request
    if (id) {
      const reading = await db
        .select()
        .from(bloodPressureReadings)
        .where(
          and(
            eq(bloodPressureReadings.id, parseInt(id)),
            eq(bloodPressureReadings.userId, Number(session?.user.id))
          )
        )
        .limit(1);

      if (reading.length === 0) {
        return NextResponse.json({ error: 'Blood pressure reading not found' }, { status: 404 });
      }
      return NextResponse.json(reading[0]);
    }

    // Handle multiple readings request
    const conditions = [eq(bloodPressureReadings.userId, Number(session?.user.id))];
    
    if (startDate) {
      conditions.push(gte(bloodPressureReadings.recordedAt, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(bloodPressureReadings.recordedAt, new Date(endDate)));
    }

    const readings = await db
      .select()
      .from(bloodPressureReadings)
      .where(and(...conditions))
      .orderBy(desc(bloodPressureReadings.recordedAt))
      .limit(limit);

    return NextResponse.json(readings);
  } catch (error) {
    console.error('Error fetching blood pressure readings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { systolic, diastolic, pulse, recordedAt } = body;

    // Validation
    if (!systolic || !diastolic) {
      return NextResponse.json({ 
        error: 'Systolic and diastolic values are required' 
      }, { status: 400 });
    }

    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);
    
    if (systolicNum < 50 || systolicNum > 300) {
      return NextResponse.json({ 
        error: 'Systolic pressure must be between 50 and 300 mmHg' 
      }, { status: 400 });
    }

    if (diastolicNum < 30 || diastolicNum > 200) {
      return NextResponse.json({ 
        error: 'Diastolic pressure must be between 30 and 200 mmHg' 
      }, { status: 400 });
    }

    if (pulse && (parseInt(pulse) < 30 || parseInt(pulse) > 220)) {
      return NextResponse.json({ 
        error: 'Pulse must be between 30 and 220 bpm' 
      }, { status: 400 });
    }

    const newReading = await db.insert(bloodPressureReadings).values({
      userId: Number(session?.user.id),
      systolic: systolicNum,
      diastolic: diastolicNum,
      pulse: pulse ? parseInt(pulse) : null,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    }).returning();

    return NextResponse.json(newReading[0], { status: 201 });
  } catch (error) {
    console.error('Error creating blood pressure reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Blood pressure reading ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { systolic, diastolic, pulse, recordedAt } = body;

    const updateData: any = {};
    
    if (systolic !== undefined) {
      const systolicNum = parseInt(systolic);
      if (systolicNum < 50 || systolicNum > 300) {
        return NextResponse.json({ 
          error: 'Systolic pressure must be between 50 and 300 mmHg' 
        }, { status: 400 });
      }
      updateData.systolic = systolicNum;
    }
    
    if (diastolic !== undefined) {
      const diastolicNum = parseInt(diastolic);
      if (diastolicNum < 30 || diastolicNum > 200) {
        return NextResponse.json({ 
          error: 'Diastolic pressure must be between 30 and 200 mmHg' 
        }, { status: 400 });
      }
      updateData.diastolic = diastolicNum;
    }
    
    if (pulse !== undefined) {
      if (pulse && (parseInt(pulse) < 30 || parseInt(pulse) > 220)) {
        return NextResponse.json({ 
          error: 'Pulse must be between 30 and 220 bpm' 
        }, { status: 400 });
      }
      updateData.pulse = pulse ? parseInt(pulse) : null;
    }
    
    if (recordedAt !== undefined) {
      updateData.recordedAt = new Date(recordedAt);
    }

    const updatedReading = await db
      .update(bloodPressureReadings)
      .set(updateData)
      .where(
        and(
          eq(bloodPressureReadings.id, parseInt(id)),
          eq(bloodPressureReadings.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (updatedReading.length === 0) {
      return NextResponse.json({ error: 'Blood pressure reading not found' }, { status: 404 });
    }

    return NextResponse.json(updatedReading[0]);
  } catch (error) {
    console.error('Error updating blood pressure reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Blood pressure reading ID is required' }, { status: 400 });
    }

    const deletedReading = await db
      .delete(bloodPressureReadings)
      .where(
        and(
          eq(bloodPressureReadings.id, parseInt(id)),
          eq(bloodPressureReadings.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (deletedReading.length === 0) {
      return NextResponse.json({ error: 'Blood pressure reading not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Blood pressure reading deleted successfully' });
  } catch (error) {
    console.error('Error deleting blood pressure reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}