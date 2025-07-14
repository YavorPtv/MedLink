import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } from "@aws-sdk/client-chime-sdk-meetings";

dotenv.config(); // Load environment variables from .env
const app = express();
app.use(cors());
app.use(express.json());
const chimeClient = new ChimeSDKMeetingsClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const meetings = {}; // simple in-memory map: roomId -> MeetingInfo

app.post('/create-meeting', async (req, res) => {
    const { roomId, userName } = req.body;

    try {
        let meetingInfo = meetings[roomId];
        if (!meetingInfo) {
            // Create a new meeting in Chime
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

        // Create an attendee for this user
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
        console.error("Failed to create meeting/attendee", err);
        res.status(500).json({ error: "Failed to create meeting or attendee" });
    }
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server with Chime SDK running on port ${port}`);
});