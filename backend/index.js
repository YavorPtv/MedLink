import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // your React URL
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined room ${roomId}`);
        socket.to(roomId).emit("user-joined", socket.id);
    });

    socket.on("offer", (data) => {
        socket.to(data.roomId).emit("offer", {
            sdp: data.sdp,
            from: socket.id,
        });
    });

    socket.on("answer", (data) => {
        socket.to(data.roomId).emit("answer", {
            sdp: data.sdp,
            from: socket.id,
        });
    });

    socket.on("ice-candidate", (data) => {
        socket.to(data.roomId).emit("ice-candidate", {
            candidate: data.candidate,
            from: socket.id,
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});

httpServer.listen(5000, () => {
    console.log("Server with Socket.IO running on port 5000");
});
