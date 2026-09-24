import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPassword, generateSessionToken } from '@/lib/auth';

// Mock database - in production, replace with actual database
const mockUsers = [
  {
    id: '1',
    email: 'admin@warehouse.com',
    password_hash: '', // Will be set on first run
    full_name: 'Admin Manager',
    role: 'admin',
    warehouse_id: 'warehouse-1',
    is_active: true,
  },
  {
    id: '2',
    email: 'worker@warehouse.com',
    password_hash: '',
    full_name: 'John Worker',
    role: 'worker',
    warehouse_id: 'warehouse-1',
    is_active: true,
  },
];

// Initialize mock passwords
let initialized = false;
if (!initialized) {
  mockUsers[0].password_hash = '$2a$10$...'; // admin123
  mockUsers[1].password_hash = '$2a$10$...'; // worker123
  initialized = true;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = mockUsers.find((u) => u.email === email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // For demo purposes, accept any password starting with the role
    const isValidPassword =
      password.startsWith(user.role) || password === 'demo123';

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Return user data and token
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            warehouse_id: user.warehouse_id,
            is_active: user.is_active,
          },
          token,
          expiresAt,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie for session
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
