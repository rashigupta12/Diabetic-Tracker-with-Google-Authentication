import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db"; // adjust path to your db connection
import { usersTable } from "@/db/schema"; // adjust path to your schema
import { eq, or } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, name } = await request.json();

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(
        or(
          eq(usersTable.username, username),
          eq(usersTable.email, email)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      if (existingUser[0].username === username) {
        return NextResponse.json(
          { message: "Username already exists" },
          { status: 400 }
        );
      }
      if (existingUser[0].email === email) {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db
      .insert(usersTable)
      .values({
        username,
        email,
        password: hashedPassword,
        name: name || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        name: usersTable.name,
      });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: newUser[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}