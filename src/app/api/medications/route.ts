/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/medications/route.ts
import { db } from '@/db';
import { medications } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const isActive = searchParams.get('isActive');

    // Handle GET request for a specific medication
    if (id) {
      const medication = await db
        .select()
        .from(medications)
        .where(
          and(
            eq(medications.id, parseInt(id)),
            eq(medications.userId, Number(session.user.id))
          )
        )
        .limit(1);

      if (medication.length === 0) {
        return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
      }

      return NextResponse.json(medication[0]);
    }

    // Handle GET request for multiple medications
    // Build filter conditions
    let filterCondition: ReturnType<typeof eq> | ReturnType<typeof and>;
    if (isActive !== null && isActive !== undefined) {
      const activeValue = isActive === 'true';
      filterCondition = and(
        eq(medications.userId, Number(session.user.id)),
        eq(medications.isActive, activeValue)
      );
    } else {
      filterCondition = eq(medications.userId, Number(session.user.id));
    }

    const userMedications = await db
      .select()
      .from(medications)
      .where(filterCondition)
      .orderBy(desc(medications.createdAt));

    return NextResponse.json(userMedications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session =await auth()
    const body = await request.json();
    const { name, dosage, frequency } = body;

    // Validation
    if (!name || !dosage || !frequency) {
      return NextResponse.json({ 
        error: 'Name, dosage, and frequency are required' 
      }, { status: 400 });
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ 
        error: 'Medication name must be between 2 and 100 characters' 
      }, { status: 400 });
    }

    const newMedication = await db.insert(medications).values({
      userId: Number(session?.user.id),
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      isActive: true,
    }).returning();

    return NextResponse.json(newMedication[0], { status: 201 });
  } catch (error) {
    console.error('Error creating medication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Medication ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, dosage, frequency, isActive } = body;

    // Validation
    if (name && (name.length < 2 || name.length > 100)) {
      return NextResponse.json({ 
        error: 'Medication name must be between 2 and 100 characters' 
      }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (dosage !== undefined) updateData.dosage = dosage.trim();
    if (frequency !== undefined) updateData.frequency = frequency.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedMedication = await db
      .update(medications)
      .set(updateData)
      .where(
        and(
          eq(medications.id, parseInt(id)),
          eq(medications.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (updatedMedication.length === 0) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    return NextResponse.json(updatedMedication[0]);
  } catch (error) {
    console.error('Error updating medication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Medication ID is required' }, { status: 400 });
    }

    // Soft delete by marking as inactive
    const updatedMedication = await db
      .update(medications)
      .set({ isActive: false })
      .where(
        and(
          eq(medications.id, parseInt(id)),
          eq(medications.userId, Number(session?.user.id))
        )
      )
      .returning();

    if (updatedMedication.length === 0) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Medication deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating medication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}