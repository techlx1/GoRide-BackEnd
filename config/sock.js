import { Server } from "socket.io";

export default function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // ✅ Replace with your frontend domain in production
      methods: ["GET", "POST"],
    },
  });

  // 🧩 Store active drivers for debugging (optional)
  const activeDrivers = new Map();

  io.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // 👨‍✈️ Driver shares live GPS location
    socket.on("driver_location", (data) => {
      const { driver_id, latitude, longitude, ride_id } = data;
      if (!driver_id || !ride_id) return;

      // Update in-memory map (useful for debugging / monitoring)
      activeDrivers.set(driver_id, { latitude, longitude });

      // Broadcast to all riders in the same ride room
      io.to(`ride_${ride_id}`).emit("driver_position", {
        driver_id,
        latitude,
        longitude,
        timestamp: new Date(),
      });
    });

    // 🚘 Rider joins ride tracking room
    socket.on("join_ride_room", (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`👥 Rider joined room ride_${rideId}`);
    });

    // 👨‍✈️ Driver joins ride room after accepting
    socket.on("join_driver_room", (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`🧭 Driver joined room ride_${rideId}`);
    });

    // 🚗 Ride completed — notify and cleanup
    socket.on("ride_completed", (rideId) => {
      io.to(`ride_${rideId}`).emit("ride_completed", {
        rideId,
        completedAt: new Date(),
      });
      io.socketsLeave(`ride_${rideId}`);
      console.log(`✅ Ride room cleared: ride_${rideId}`);
    });

    // 🔌 Disconnect Handling
    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} (${reason})`);

      // Remove driver from active list
      for (const [id, location] of activeDrivers.entries()) {
        if (location.socketId === socket.id) {
          activeDrivers.delete(id);
        }
      }
    });
  });

  return io;
}
