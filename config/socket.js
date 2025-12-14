import { Server } from "socket.io";

let ioInstance = null;

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: "*", // 🔒 Restrict in production
      methods: ["GET", "POST"],
    },
  });

  // 🧩 Optional: track active drivers
  const activeDrivers = new Map();

  ioInstance.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    /* ============================================================
       🔔 DRIVER NOTIFICATION ROOM
    ============================================================ */
    socket.on("register_driver", ({ driver_id }) => {
      if (!driver_id) return;

      socket.join(`driver_${driver_id}`);
      console.log(`📡 Driver registered for notifications: driver_${driver_id}`);
    });

    /* ============================================================
       📍 DRIVER LIVE LOCATION
    ============================================================ */
    socket.on("driver_location", (data) => {
      const { driver_id, latitude, longitude, ride_id } = data;
      if (!driver_id || !latitude || !longitude) return;

      activeDrivers.set(driver_id, {
        latitude,
        longitude,
        socketId: socket.id,
      });

      // Broadcast only if ride is active
      if (ride_id) {
        ioInstance.to(`ride_${ride_id}`).emit("driver_position", {
          driver_id,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        });
      }
    });

    /* ============================================================
       🚘 RIDE ROOMS
    ============================================================ */
    socket.on("join_ride_room", (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`👥 Rider joined ride_${rideId}`);
    });

    socket.on("join_driver_room", (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`🧭 Driver joined ride_${rideId}`);
    });

    socket.on("ride_completed", (rideId) => {
      ioInstance.to(`ride_${rideId}`).emit("ride_completed", {
        rideId,
        completedAt: new Date().toISOString(),
      });

      ioInstance.socketsLeave(`ride_${rideId}`);
      console.log(`✅ Ride room closed: ride_${rideId}`);
    });

    /* ============================================================
       🔌 DISCONNECT
    ============================================================ */
    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} (${reason})`);

      for (const [driverId, data] of activeDrivers.entries()) {
        if (data.socketId === socket.id) {
          activeDrivers.delete(driverId);
        }
      }
    });
  });

  return ioInstance;
};

/* ============================================================
   🔁 SOCKET SINGLETON ACCESS
============================================================ */
export const getIO = () => {
  if (!ioInstance) {
    throw new Error("❌ Socket.io not initialized");
  }
  return ioInstance;
};
