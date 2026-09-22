import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// GET all users (Admin & Coordinator only)
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'COORDINATOR')) {
      return NextResponse.json({ error: 'Unauthorized. Admin or Coordinator access required.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            assignedPeople: true,
            relationshipPeople: true,
            callLogs: true,
            followups: true,
          }
        }
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST create new user
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'COORDINATOR')) {
      return NextResponse.json({ error: 'Unauthorized. Admin or Coordinator access required.' }, { status: 403 });
    }

    const { name, username, email, phone, role, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingEmail) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username: username.toLowerCase().trim() } });
      if (existingUsername) {
        return NextResponse.json({ error: 'This username is already taken' }, { status: 400 });
      }
    }

    // Generate initials for avatar
    const initials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username ? username.toLowerCase().trim() : null,
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        role: role || 'CALLING_VOLUNTEER',
        passwordHash: hashPassword(password),
        avatar: initials,
        active: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        active: true,
      }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

// PATCH update user (role, active status, reset password)
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'COORDINATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, role, active, newPassword } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (newPassword) updateData.passwordHash = hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
