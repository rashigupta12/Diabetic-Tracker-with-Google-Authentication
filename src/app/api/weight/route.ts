import { sessions, Session } from './../../../db/schema';
// src/app/api/weight/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { weightReadings } from '@/db/schema';
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
        .from(weightReadings)
        .where(
          and(
            eq(weightReadings.id, parseInt(id)),
            eq(weightReadings.userId, Number(session.user.id))
          )
        )
        .limit(1);

      if (reading.length === 0) {
        return NextResponse.json({ error: 'Weight reading not found' }, { status: 404 });
      }
      return NextResponse.json(reading[0]);
    }

    // Handle multiple readings request
    const conditions = [eq(weightReadings.userId, Number(session.user.id))];
    
    if (startDate) {
      conditions.push(gte(weightReadings.recordedAt, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(weightReadings.recordedAt, new Date(endDate)));
    }

    const readings = await db
      .select()
      .from(weightReadings)
      .where(and(...conditions))
      .orderBy(desc(weightReadings.recordedAt))
      .limit(limit);

    return NextResponse.json(readings);
  } catch (error) {
    console.error('Error fetching weight readings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json();
    const { weight, recordedAt } = body;

    // Validation
    if (!weight) {
      return NextResponse.json({ 
        error: 'Weight is required' 
      }, { status: 400 });
    }

    const weightNum = parseFloat(weight);
    if (weightNum < 10 || weightNum > 1000) {
      return NextResponse.json({ 
        error: 'Weight must be between 10 and 1000 kg' 
      }, { status: 400 });
    }

    if (!session?.user?.id || typeof session.user.id !== 'number') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newReading = await db.insert(weightReadings).values({
      userId: session.user.id,
      weight: weightNum.toString(),
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    }).returning();

    return NextResponse.json(newReading[0], { status: 201 });
  } catch (error) {
    console.error('Error creating weight reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
 const session = await auth()
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Weight reading ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { weight, recordedAt } = body;

    const updateData: any = {};
    
    if (weight !== undefined) {
      const weightNum = parseFloat(weight);
      if (weightNum < 10 || weightNum > 1000) {
        return NextResponse.json({ 
          error: 'Weight must be between 10 and 1000 kg' 
        }, { status: 400 });
      }
      updateData.weight = weightNum.toString();
    }
    
    if (recordedAt !== undefined) {
      updateData.recordedAt = new Date(recordedAt);
    }

    const updatedReading = await db
      .update(weightReadings)
      .set(updateData)
      .where(
        and(
          eq(weightReadings.id, parseInt(id)),
          eq(weightReadings.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (updatedReading.length === 0) {
      return NextResponse.json({ error: 'Weight reading not found' }, { status: 404 });
    }

    return NextResponse.json(updatedReading[0]);
  } catch (error) {
    console.error('Error updating weight reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Weight reading ID is required' }, { status: 400 });
    }

    const deletedReading = await db
      .delete(weightReadings)
      .where(
        and(
          eq(weightReadings.id, parseInt(id)),
          eq(weightReadings.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (deletedReading.length === 0) {
      return NextResponse.json({ error: 'Weight reading not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Weight reading deleted successfully' });
  } catch (error) {
    console.error('Error deleting weight reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}