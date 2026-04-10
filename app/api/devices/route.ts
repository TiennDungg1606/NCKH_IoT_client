import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Device from '@/models/Device';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const devices = await Device.find({ owner: userId });

    return NextResponse.json(devices);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { mac, name, isMultiDevice, subIds, portNames, userId } = body;

    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get('userId')?.value;
    const finalUserId = userId || cookieUserId;

    if (!finalUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      owner: finalUserId
    });

    await User.findByIdAndUpdate(finalUserId, {
      $addToSet: { device: mac }
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { deviceId, name, portNames, schedules } = body;

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!deviceId) {
      return NextResponse.json({ error: 'Thiếu deviceId' }, { status: 400 });
    }

    await dbConnect();

    const device = await Device.findOne({ deviceId, owner: userId });
    if (!device) {
      return NextResponse.json({ error: 'Không tìm thấy thiết bị' }, { status: 404 });
    }

    if (name !== undefined) device.name = name;
    if (portNames !== undefined) device.portNames = portNames;
    if (schedules !== undefined) device.schedules = schedules;

    await device.save();

    return NextResponse.json(device, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
