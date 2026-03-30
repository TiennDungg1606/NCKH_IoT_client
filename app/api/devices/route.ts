import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Device from '@/models/Device';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const devices = await Device.find({ owner: (session.user as any).id });
    
    return NextResponse.json(devices);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { deviceId, name } = body;

    if (!deviceId || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await dbConnect();

    // Check if device already exists
    const existing = await Device.findOne({ deviceId });
    if (existing) {
      return NextResponse.json({ error: 'Device ID already registered' }, { status: 400 });
    }

    const device = await Device.create({
      deviceId,
      name,
      owner: (session.user as any).id
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
