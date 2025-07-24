import { useState, useRef, useEffect } from "react";
import { Box, Typography, Paper, Stack } from "@mui/material";
import SubtitlesIcon from "@mui/icons-material/Subtitles";

// Props: roomId, userName, onFinalTranscript (optional callback)
export default function VideoTranscriptionPanel({ roomId, userName, onFinalTranscript }) {
    const [transcriptLog, setTranscriptLog] = useState([]); // {speaker, text}
    const [livePartial, setLivePartial] = useState({ speaker: "", text: "" });
    const wsRef = useRef(null);
    const mediaRecorderRef = useRef(null);

    useEffect(() => {
        // --- Open WebSocket ---
        const ws = new window.WebSocket('ws://localhost:3000'); // Change for prod!
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                languageCode: 'en-US',
                sampleRate: 16000,
                sessionId: roomId,
                speaker: userName || 'Anonymous',
            }));
        };

        ws.onmessage = (event) => {
            try {
                const { transcript, isPartial, speaker } = JSON.parse(event.data);
                if (isPartial) {
                    setLivePartial({ speaker, text: transcript });
                } else {
                    setTranscriptLog(prev => [...prev, { speaker, text: transcript }]);
                    setLivePartial({ speaker: "", text: "" });
                    if (onFinalTranscript) onFinalTranscript({ speaker, text: transcript });
                }
            } catch (err) {
                console.error("Transcript parse error", err);
            }
        };

        // --- Setup MediaRecorder ---
        let mediaRecorder;
        let audioStream;

        async function startRecording() {
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new window.MediaRecorder(audioStream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.addEventListener("dataavailable", async (event) => {
                    if (event.data.size > 0 && ws.readyState === 1) {
                        const arrayBuffer = await event.data.arrayBuffer();
                        ws.send(arrayBuffer);
                    }
                });

                mediaRecorder.start(250);
            } catch (err) {
                console.error('Could not start media recorder', err);
            }
        }

        startRecording();

        // --- Cleanup ---
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (audioStream) {
                audioStream.getTracks().forEach((track) => track.stop());
            }
            if (wsRef.current && wsRef.current.readyState === 1) {
                wsRef.current.close();
            }
        };
    }, [roomId, userName, onFinalTranscript]);

    return (
        <Paper
            elevation={3}
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                p: 2,
                minWidth: 320,
                maxWidth: 400,
                bgcolor: "#fafbfc",
            }}
        >
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <SubtitlesIcon color="primary" />
                <Typography variant="h6" sx={{ color: "#1976d2" }}>
                    Live Transcription
                </Typography>
            </Box>
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    mb: 1,
                    pr: 1,
                    bgcolor: "#f5f8fa",
                    borderRadius: 2,
                }}
            >
                <Stack spacing={1}>
                    {transcriptLog.map((entry, i) => (
                        <Box key={i} sx={{ bgcolor: "#e8f5e9", px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}>
                            <Typography variant="caption" sx={{ color: "#888", fontWeight: 500, mb: 0.5 }}>
                                {entry.speaker}
                            </Typography>
                            <Typography variant="body2">{entry.text}</Typography>
                        </Box>
                    ))}
                    {livePartial.text && (
                        <Box sx={{ bgcolor: "#fffde7", px: 2, py: 1, borderRadius: 2, opacity: 0.8, boxShadow: 0 }}>
                            <Typography variant="caption" sx={{ color: "#888", fontWeight: 500, mb: 0.5 }}>
                                {livePartial.speaker}
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                                {livePartial.text}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Box>
        </Paper>
    );
}
