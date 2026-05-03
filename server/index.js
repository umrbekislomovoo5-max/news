import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import authRouter from "./routes/auth.js";
import messageRouter from "./routes/message.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const port = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

// MongoDB Connection
if (MONGO_URL) {
    mongoose
        .connect(MONGO_URL)
        .then(() => {
            console.log("database connected");
        })
        .catch((err) => {
            console.log(err.message);
        });
} else {
    console.log("MongoDB URL is not set, skipping database connection");
}

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);

// Serve index.html for all other routes (SPA)
app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
    }
    res.sendFile(path.join(publicPath, "index.html"));
});

const server = app.listen(port, "0.0.0.0", () => {
    console.log('🚀 Server running on http://localhost:' + port);
    console.log('📱 Frontend: http://localhost:' + port);
    console.log('🔌 API: http://localhost:' + port + '/api');
});

const io = new Server(server, {
    cors: {
        origin: "*",
        credentials: true,
    },
});

global.onlineUsers = new Map();
global.userIdToUsername = new Map(); 
global.usernameToUserId = new Map(); // NEW: Map username to userId

io.on('connection', (socket) => {
    global.chatSocket = socket;
    socket.on('add-user', (data) => {
        // data = { userId, username }
        const userId = typeof data === 'string' ? data : data.userId;
        const username = data.username || data;
        
        global.onlineUsers.set(userId, socket.id);
        global.userIdToUsername.set(userId, username);
        global.usernameToUserId.set(username, userId); // NEW: Store reverse mapping
        console.log(`User ${username} (${userId}) is online`);
        
        // Send current online users list to this new user
        const onlineList = Array.from(global.userIdToUsername.values());
        socket.emit('online-users-list', onlineList);
        
        // Broadcast to all clients that a user came online
        io.emit('user-online', { userId, username });
    });

    socket.on('send-msg', (data) => {
        // data.to is username, convert to userId
        const toUserId = global.usernameToUserId.get(data.to);
        const toSocketId = toUserId ? global.onlineUsers.get(toUserId) : null;
        
        if (toSocketId) {
            // Send message with sender info
            socket.to(toSocketId).emit('msg-recieve', {
                from: data.from,  // sender username
                msg: data.msg,    // message text
                timestamp: new Date()
            });
            console.log(`Message from ${data.from} to ${data.to}: ${data.msg}`);
        } else {
            console.log(`User ${data.to} not found or offline`);
        }
    });

    socket.on('disconnect', () => {
        // Barcha online users dan bu socket-ni o'chir
        for (let [userId, socketId] of global.onlineUsers.entries()) {
            if (socketId === socket.id) {
                const username = global.userIdToUsername.get(userId);
                global.onlineUsers.delete(userId);
                global.userIdToUsername.delete(userId);
                global.usernameToUserId.delete(username); // NEW: Clean up reverse map
                console.log(`User ${username} (${userId}) is offline`);
                
                // Broadcast to all clients that user went offline
                io.emit('user-offline', { userId, username });
                break;
            }
        }
    });
});