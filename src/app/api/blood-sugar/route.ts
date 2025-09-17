/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/blood-sugar/route.ts
import { db } from '@/db';
import { bloodSugarReadings } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Handle GET request for a specific reading
    if (id) {
      const reading = await db
        .select()
        .from(bloodSugarReadings)
        .where(
          and(
            eq(bloodSugarReadings.id, parseInt(id)),
            eq(bloodSugarReadings.userId, Number(session?.user.id))
          )
        )
        .limit(1);

      if (reading.length === 0) {
        return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
      }

      return NextResponse.json(reading[0]);
    }
    
    // Handle GET request for multiple readings
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mealType = searchParams.get('mealType');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build conditions for filtering
    const conditions = [eq(bloodSugarReadings.userId, Number(session?.user.id))];
    
    if (startDate) {
      conditions.push(gte(bloodSugarReadings.readingTime, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(bloodSugarReadings.readingTime, new Date(endDate)));
    }
    
    if (mealType) {
      conditions.push(eq(bloodSugarReadings.mealType, mealType as any));
    }

    const query = db
      .select()
      .from(bloodSugarReadings)
      .where(and(...conditions))
      .orderBy(desc(bloodSugarReadings.readingTime))
      .limit(limit);

    const readings = await query;
    return NextResponse.json(readings);
  } catch (error) {
    console.error('Error fetching blood sugar readings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { glucose, mealType, notes, readingTime } = body;

    // Validation
    if (!glucose || !mealType) {
      return NextResponse.json({ 
        error: 'Glucose value and meal type are required' 
      }, { status: 400 });
    }

    if (glucose < 10 || glucose > 1000) {
      return NextResponse.json({ 
        error: 'Glucose value must be between 10 and 1000 mg/dL' 
      }, { status: 400 });
    }

    const validMealTypes = ['before_breakfast', 'after_breakfast', 'before_lunch', 'after_lunch', 'before_dinner', 'after_dinner', 'bedtime'];
    if (!validMealTypes.includes(mealType)) {
      return NextResponse.json({ 
        error: 'Invalid meal type' 
      }, { status: 400 });
    }

    const newReading = await db.insert(bloodSugarReadings).values({
      userId: Number(session?.user.id),
      glucose: parseInt(glucose),
      mealType,
      notes: notes || null,
      readingTime: readingTime ? new Date(readingTime) : new Date(),
    }).returning();

    return NextResponse.json(newReading[0], { status: 201 });
  } catch (error) {
    console.error('Error creating blood sugar reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Reading ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { glucose, mealType, notes, readingTime } = body;

    // Validation
    if (glucose && (glucose < 10 || glucose > 1000)) {
      return NextResponse.json({ 
        error: 'Glucose value must be between 10 and 1000 mg/dL' 
      }, { status: 400 });
    }

    const validMealTypes = ['before_breakfast', 'after_breakfast', 'before_lunch', 'after_lunch', 'before_dinner', 'after_dinner', 'bedtime'];
    if (mealType && !validMealTypes.includes(mealType)) {
      return NextResponse.json({ 
        error: 'Invalid meal type' 
      }, { status: 400 });
    }

    const updateData: any = {};
    if (glucose !== undefined) updateData.glucose = parseInt(glucose);
    if (mealType !== undefined) updateData.mealType = mealType;
    if (notes !== undefined) updateData.notes = notes;
    if (readingTime !== undefined) updateData.readingTime = new Date(readingTime);

    const updatedReading = await db
      .update(bloodSugarReadings)
      .set(updateData)
      .where(
        and(
          eq(bloodSugarReadings.id, parseInt(id)),
          eq(bloodSugarReadings.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (updatedReading.length === 0) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    return NextResponse.json(updatedReading[0]);
  } catch (error) {
    console.error('Error updating blood sugar reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Reading ID is required' }, { status: 400 });
    }

    const deletedReading = await db
      .delete(bloodSugarReadings)
      .where(
        and(
          eq(bloodSugarReadings.id, parseInt(id)),
          eq(bloodSugarReadings.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (deletedReading.length === 0) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Reading deleted successfully' });
  } catch (error) {
    console.error('Error deleting blood sugar reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}