const express = require("express");
const connectDB = require("./db");
const { Room, Booking } = require("./models");

const app = express();
const port = 3000;

app.use(express.json());
connectDB();

// Endpoint to create a room
app.post("/rooms", async (req, res) => {
  const { numberOfSeats, amenities, pricePerHour } = req.body;
  try {
    const newRoom = new Room({ numberOfSeats, amenities, pricePerHour });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint to book a room
app.post("/bookings", async (req, res) => {
  const { customerName, date, startTime, endTime, roomId } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check for booking conflicts
    const conflict = await Booking.findOne({
      roomId,
      date,
      $or: [
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gt: startTime } },
          ],
        },
        {
          $and: [
            { startTime: { $gte: startTime } },
            { startTime: { $lt: endTime } },
          ],
        },
      ],
    });

    if (conflict) {
      return res
        .status(400)
        .json({ error: "Room is already booked at this time" });
    }

    const newBooking = new Booking({
      customerName,
      date,
      startTime,
      endTime,
      roomId,
    });
    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint to list all rooms with booked data
app.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find();
    const bookings = await Booking.find();

    const response = rooms.map((room) => {
      const roomBookings = bookings.filter(
        (b) => b.roomId.toString() === room._id.toString()
      );
      return {
        ...room._doc,
        bookings: roomBookings,
      };
    });

    res.json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint to list all customers with booked data
app.get("/customers", async (req, res) => {
  try {
    const bookings = await Booking.find();
    const rooms = await Room.find();

    const response = bookings.map((b) => {
      const room = rooms.find((r) => r._id.toString() === b.roomId.toString());
      return {
        customerName: b.customerName,
        roomName: room ? `Room ${room._id}` : "Unknown",
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
      };
    });

    res.json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint to list how many times a customer has booked a room
app.get("/bookings/customer", async (req, res) => {
  const { customerName, roomName } = req.query;
  try {
    const room = await Room.findOne({ roomName: roomName });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const customerBookings = await Booking.find({
      customerName,
      roomId: room._id,
    });

    res.json({
      customerName,
      roomName,
      bookings: customerBookings.map((b) => ({
        bookingId: b.bookingId,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        bookingDate: b._id.getTimestamp(),
        bookingStatus: "Confirmed",
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
