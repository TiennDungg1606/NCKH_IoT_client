import mongoose, { Schema, model, models } from 'mongoose';

const DeviceSchema = new Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true, // The ESP32 MAC address
  },
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isMultiDevice: {
    type: Boolean,
    default: true,
  },
  subIds: {
    type: [Number],
    default: [],
  },
  portNames: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
});

const Device = models.Device || model('Device', DeviceSchema);

export default Device;
