import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } from "@aws-sdk/client-chime-sdk-meetings";
import http from 'http';
import { TranscribeStreamingClient, StartMedicalStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import WebSocket, { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

dotenv.config(); // Load environment variables from .env
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app); // Needed for WebSocket
const wss = new WebSocketServer({ server });

const chimeClient = new ChimeSDKMeetingsClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const meetings = {}; // simple in-memory map: roomId -> MeetingInfo

app.post('/join-meeting', async (req, res) => {
    const { roomId, userName, mode } = req.body;
    try {
        let meetingInfo = meetings[roomId];

        if (mode === 'join') {
            if (!meetingInfo) {
                return res.status(404).json({ error: "Meeting not found" });
            }
        } else if (mode === 'create') {
            if (!meetingInfo) {
                // Create new meeting
                const createMeetingCmd = new CreateMeetingCommand({
                    ClientRequestToken: roomId,
                    MediaRegion: "eu-central-1",
                    ExternalMeetingId: roomId,
                });
                const meetingResponse = await chimeClient.send(createMeetingCmd);
                meetingInfo = meetingResponse.Meeting;
                meetings[roomId] = meetingInfo;
                console.log(`Created new meeting for room ${roomId}`);
            }
        } else {
            return res.status(400).json({ error: "Invalid mode" });
        }

        // Create attendee for this user
        const createAttendeeCmd = new CreateAttendeeCommand({
            MeetingId: meetingInfo.MeetingId,
            ExternalUserId: userName || Math.random().toString(36).substring(2, 15),
        });
        const attendeeResponse = await chimeClient.send(createAttendeeCmd);

        res.json({
            Meeting: meetingInfo,
            Attendee: attendeeResponse.Attendee
        });
    } catch (err) {
        console.error("Failed to join meeting", err);
        res.status(500).json({ error: "Failed to join meeting" });
    }
});

const transcribeClient = new TranscribeStreamingClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Helper for PCM audio (browser may need conversion—see client notes)
function ffmpegPCMAsyncIterable(ws) {
    const ffmpeg = spawn('./bin/ffmpeg.exe', [
        '-f', 'webm',
        '-i', 'pipe:0',
        '-f', 's16le',
        '-ar', '16000',
        '-ac', '1',
        'pipe:1'
    ]);
    // Handle ffmpeg errors
    ffmpeg.stderr.on('data', data => {
        // Optional: console.error('ffmpeg:', data.toString());
    });
    ffmpeg.on('error', err => {
        console.error('ffmpeg process error:', err);
    });
    ffmpeg.on('close', code => {
        // Optional: console.log('ffmpeg closed', code);
    });

    ws.on('message', (data) => {
        // Feed WebM blob data to ffmpeg stdin
        ffmpeg.stdin.write(data);
    });
    ws.on('close', () => {
        ffmpeg.stdin.end();
    });
    ws.on('error', () => {
        ffmpeg.stdin.end();
    });

    // Async generator: yields PCM for AWS
    return {
        [Symbol.asyncIterator]: async function* () {
            for await (const chunk of ffmpeg.stdout) {
                yield { AudioEvent: { AudioChunk: chunk } };
            }
        }
    };
}

const meetingRooms = {};

function addToRoom(meetingId, ws) {
    if (!meetingRooms[meetingId]) meetingRooms[meetingId] = new Set();
    meetingRooms[meetingId].add(ws);
}

function removeFromRooms(ws) {
    for (const sockets of Object.values(meetingRooms)) {
        sockets.delete(ws);
    }
}

wss.on('connection', async (ws) => {
    let initialized = false;
    let audioStream;
    let currentMeetingId = null;

    ws.on('message', async (msg, isBinary) => {
        console.log(msg.length);
        if (!initialized) {
            // Always expect JSON for session init first
            try {
                const initMsg = JSON.parse(isBinary ? msg.toString() : msg);
                if (!initMsg.sessionId) {
                    ws.send(JSON.stringify({ error: "Must initialize session first" }));
                    ws.close();
                    return;
                }
                currentMeetingId = initMsg.sessionId;
                initialized = true;
                addToRoom(currentMeetingId, ws);

                // Transcription setup (unchanged)
                audioStream = ffmpegPCMAsyncIterable(ws);
                const command = new StartMedicalStreamTranscriptionCommand({
                    LanguageCode: 'en-US',
                    MediaSampleRateHertz: 16000,
                    MediaEncoding: "pcm",
                    Specialty: "PRIMARYCARE",
                    Type: "CONVERSATION",
                    AudioStream: audioStream,
                });
                const transcription = await transcribeClient.send(command);
                for await (const event of transcription.TranscriptResultStream) {
                    if (event.TranscriptEvent) {
                        const results = event.TranscriptEvent.Transcript.Results;
                        for (const result of results) {
                            if (result.Alternatives.length > 0) {
                                const transcript = result.Alternatives[0].Transcript;
                                ws.send(JSON.stringify({
                                    transcript,
                                    isPartial: !!result.IsPartial,
                                    speaker: initMsg.speaker || "Unknown"
                                }));
                            }
                        }
                    }
                }
            } catch (err) {
                ws.send(JSON.stringify({ error: "Failed to initialize transcription: " + err.message }));
                ws.close();
            }
            return;
        }

        // ---- After session is initialized ----
        // 1. Try to parse JSON (chat message)
        try {
            const parsed = JSON.parse(isBinary ? msg.toString() : msg);
            if (parsed.action === "chat-message") {
                const chatMsg = {
                    type: "chat-message",
                    meetingId: parsed.meetingId,
                    senderId: parsed.senderId,
                    senderName: parsed.senderName,
                    text: parsed.text,
                    timestamp: parsed.timestamp,
                };
                if (meetingRooms[parsed.meetingId]) {
                    for (const client of meetingRooms[parsed.meetingId]) {
                        if (client.readyState === ws.OPEN) {
                            client.send(JSON.stringify(chatMsg));
                        }
                    }
                }
                return;
            }
        } catch (err) {
            // Not JSON: must be audio (handled by ffmpegPCMAsyncIterable)
        }
        // If not JSON, assume it's audio (handled by ffmpeg async iterator)
    });

    ws.on('close', () => {
        removeFromRooms(ws);
        if (audioStream && typeof audioStream.push === 'function') {
            audioStream.push(null);
        }
    });
});

const dynamo = new DynamoDBClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

app.post('/save-record', async (req, res) => {
    const {
        meetingId,
        doctorId,
        patientId,
        startTime,
        endTime,
        transcript, // Array of {speaker, text}
        status
    } = req.body;

    try {
        const params = {
            TableName: "MedLinkMeetings",
            Item: {
                MeetingId: { S: meetingId },
                DoctorId: { S: doctorId },
                PatientId: { S: patientId },
                StartTime: { S: startTime },
                EndTime: { S: endTime },
                Status: { S: status || "completed" },
                Transcript: { S: JSON.stringify(transcript || []) }
            }
        };

        await dynamo.send(new PutItemCommand(params));
        res.json({ success: true });
    } catch (err) {
        console.error("Failed to save meeting record:", err);
        res.status(500).json({ error: "Failed to save meeting record" });
    }
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server with Chime SDK running on port ${port}`);
});