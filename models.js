const mongoose = require("mongoose");

// Room Schema
const roomSchema = new mongoose.Schema({
  numberOfSeats: { type: Number, required: true },
  amenities: { type: [String], required: true },
  pricePerHour: { type: Number, required: true },
});

const Room = mongoose.model("Room", roomSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = {
  Room,
  Booking,
};
