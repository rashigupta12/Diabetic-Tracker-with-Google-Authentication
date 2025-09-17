// app/api/medication-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicationLogs, medications } from '@/db/schema';
import { eq, desc, and, gte, lte, lt } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { Session } from 'inspector/promises';


export async function GET(request: NextRequest) {
  try {
 const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const medicationId = searchParams.get('medicationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const taken = searchParams.get('taken');
    const today = searchParams.get('today');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Handle GET request for a specific log
    if (id) {
      const log = await db
        .select()
        .from(medicationLogs)
        .where(
          and(
            eq(medicationLogs.id, parseInt(id)),
            eq(medicationLogs.userId, Number(session?.user.id))
          )
        )
        .limit(1);

      if (log.length === 0) {
        return NextResponse.json({ error: 'Medication log not found' }, { status: 404 });
      }

      return NextResponse.json(log[0]);
    }

    // Handle today's logs special endpoint
    if (today === 'true') {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const tomorrow = new Date(todayDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayLogs = await db
        .select({
          id: medicationLogs.id,
          medicationId: medicationLogs.medicationId,
          takenAt: medicationLogs.takenAt,
          taken: medicationLogs.taken,
          notes: medicationLogs.notes,
          medicationName: medications.name,
          medicationDosage: medications.dosage,
          medicationFrequency: medications.frequency,
        })
        .from(medicationLogs)
        .leftJoin(medications, eq(medicationLogs.medicationId, medications.id))
        .where(
          and(
            eq(medicationLogs.userId, Number(session.user.id)),
            gte(medicationLogs.takenAt, todayDate),
            lt(medicationLogs.takenAt, tomorrow)
          )
        );

      return NextResponse.json(todayLogs);
    }

    // Handle general logs query
    const conditions = [eq(medicationLogs.userId, Number(session.user.id))];
    
    if (medicationId) {
      conditions.push(eq(medicationLogs.medicationId, parseInt(medicationId)));
    }
    
    if (startDate) {
      conditions.push(gte(medicationLogs.takenAt, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(medicationLogs.takenAt, new Date(endDate)));
    }
    
    if (taken !== null) {
      conditions.push(eq(medicationLogs.taken, taken === 'true'));
    }

    const logs = await db
      .select({
        id: medicationLogs.id,
        medicationId: medicationLogs.medicationId,
        takenAt: medicationLogs.takenAt,
        taken: medicationLogs.taken,
        notes: medicationLogs.notes,
        medicationName: medications.name,
        medicationDosage: medications.dosage,
        medicationFrequency: medications.frequency,
      })
      .from(medicationLogs)
      .leftJoin(medications, eq(medicationLogs.medicationId, medications.id))
      .where(and(...conditions))
      .orderBy(desc(medicationLogs.takenAt))
      .limit(limit);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching medication logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { medicationId, taken, notes, takenAt } = body;

    // Validation
    if (!medicationId) {
      return NextResponse.json({ 
        error: 'Medication ID is required' 
      }, { status: 400 });
    }

    // Verify that the medication belongs to the user
    const medication = await db
      .select()
      .from(medications)
      .where(
        and(
          eq(medications.id, parseInt(medicationId)),
          eq(medications.userId, Number(session?.user.id))
        )
      )
      .limit(1);

    if (medication.length === 0) {
      return NextResponse.json({ 
        error: 'Medication not found or does not belong to user' 
      }, { status: 404 });
    }

    const newLog = await db.insert(medicationLogs).values({
      userId: Number(session?.user.id),
      medicationId: parseInt(medicationId),
      taken: taken !== false, // Default to true if not specified
      notes: notes || null,
      takenAt: takenAt ? new Date(takenAt) : new Date(),
    }).returning();

    return NextResponse.json(newLog[0], { status: 201 });
  } catch (error) {
    console.error('Error creating medication log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Medication log ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { taken, notes, takenAt } = body;

    const updateData: any = {};
    if (taken !== undefined) updateData.taken = taken;
    if (notes !== undefined) updateData.notes = notes;
    if (takenAt !== undefined) updateData.takenAt = new Date(takenAt);

    const updatedLog = await db
      .update(medicationLogs)
      .set(updateData)
      .where(
        and(
          eq(medicationLogs.id, parseInt(id)),
          eq(medicationLogs.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (updatedLog.length === 0) {
      return NextResponse.json({ error: 'Medication log not found' }, { status: 404 });
    }

    return NextResponse.json(updatedLog[0]);
  } catch (error) {
    console.error('Error updating medication log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
     const session = await auth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Medication log ID is required' }, { status: 400 });
    }

    const deletedLog = await db
      .delete(medicationLogs)
      .where(
        and(
          eq(medicationLogs.id, parseInt(id)),
          eq(medicationLogs.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (deletedLog.length === 0) {
      return NextResponse.json({ error: 'Medication log not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Medication log deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}