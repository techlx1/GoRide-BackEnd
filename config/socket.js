import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let ioInstance = null;

/* ============================================================
   🧠 GLOBAL ACTIVE DRIVERS MAP (SINGLETON)
============================================================ */
const activeDrivers = new Map();

export const initSocket = (server) => {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(server, {
    cors: {
      origin: "*", // 🔒 Restrict in production
      methods: ["GET", "POST"],
    },
    transports: ["websocket"],
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  /* ============================================================
     🔐 SOCKET AUTH (JWT)
  ============================================================ */
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized: token missing"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  /* ============================================================
     🔌 CONNECTION HANDLER
  ============================================================ */
  ioInstance.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    let lastLocationUpdate = 0;

    /* ============================================================
       🔔 DRIVER NOTIFICATION ROOM
    ============================================================ */
    socket.on("register_driver", ({ driver_id }) => {
      if (!driver_id) return;

      // 🔒 Validate identity
      if (socket.user.id !== driver_id) {
        console.warn("⚠️ Driver ID mismatch on register");
        return;
      }

      socket.join(`driver_${driver_id}`);
      console.log(`📡 Driver registered: driver_${driver_id}`);
    });

    /* ============================================================
       📍 DRIVER LIVE LOCATION (THROTTLED)
    ============================================================ */
    socket.on("driver_location", (data) => {
      const now = Date.now();

      // ⏱ Throttle updates (1/sec)
      if (now - lastLocationUpdate < 1000) return;
      lastLocationUpdate = now;

      const { driver_id, latitude, longitude, ride_id } = data;

      if (!driver_id || latitude == null || longitude == null) return;

      // 🔒 Validate sender
      if (socket.user.id !== driver_id) return;

      activeDrivers.set(driver_id, {
        latitude,
        longitude,
        socketId: socket.id,
        updatedAt: new Date().toISOString(),
      });

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
      if (!rideId) return;
      socket.join(`ride_${rideId}`);
      console.log(`👥 User joined ride_${rideId}`);
    });

    socket.on("join_driver_room", (rideId) => {
      if (!rideId) return;
      socket.join(`ride_${rideId}`);
      console.log(`🧭 Driver joined ride_${rideId}`);
    });

    socket.on("ride_completed", (rideId) => {
      if (!rideId) return;

      ioInstance.to(`ride_${rideId}`).emit("ride_completed", {
        rideId,
        completedAt: new Date().toISOString(),
      });

      // 🧹 SAFE ROOM CLEANUP
      const room = ioInstance.sockets.adapter.rooms.get(`ride_${rideId}`);
      if (room) {
        for (const socketId of room) {
          ioInstance.sockets.sockets
            .get(socketId)
            ?.leave(`ride_${rideId}`);
        }
      }

      console.log(`✅ Ride room closed: ride_${rideId}`);
    });

    /* ============================================================
       🔌 DISCONNECT CLEANUP
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

  console.log("🔌 Socket.IO initialized");
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
