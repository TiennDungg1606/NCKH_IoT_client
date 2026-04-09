import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Device from '@/models/Device';
import User from '@/models/User';

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
    let { mac, name, isMultiDevice, subIds, portNames } = body;

    if (!mac) {
      return NextResponse.json({ error: 'Chưa nhập địa chỉ MAC' }, { status: 400 });
    }

    if (!name) name = 'Thiết bị ' + mac.slice(-4);

    await dbConnect();

    const existing = await Device.findOne({ deviceId: mac });
    if (existing) {
      return NextResponse.json({ error: 'Thiết bị này đã được đăng ký' }, { status: 400 });
    }

    const device = await Device.create({
      deviceId: mac,
      name,
      isMultiDevice: isMultiDevice !== undefined ? isMultiDevice : true,
      subIds: subIds || [],
      portNames: portNames || {},
      owner: (session.user as any).id
    });

    await User.findByIdAndUpdate((session.user as any).id, {
      $addToSet: { device: mac }
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
