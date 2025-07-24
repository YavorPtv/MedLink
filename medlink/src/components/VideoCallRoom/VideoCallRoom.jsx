import { useEffect } from 'react';
import {
    useMeetingManager,
    useAudioVideo,
    useLocalVideo,
    useVideoInputs,
    VideoTileGrid,
    LocalVideo,
} from 'amazon-chime-sdk-component-library-react';
import { MeetingSessionConfiguration } from 'amazon-chime-sdk-js';
import { useRef } from 'react';
import { Box, AppBar, Toolbar, IconButton, Button, Drawer, Typography, Divider, Collapse, Paper, Grid } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import InfoIcon from '@mui/icons-material/Info';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';

export default function VideoCallRoom({ meetingData, roomId, userName }) {
    const meetingManager = useMeetingManager();
    const audioVideo = useAudioVideo();
    const { toggleVideo } = useLocalVideo();
    const { devices: videoDevices } = useVideoInputs();
    const hasJoined = useRef(false);

    const [showChat, setShowChat] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [muted, setMuted] = useState(false);
    const [videoOn, setVideoOn] = useState(true);

    const [transcriptLog, setTranscriptLog] = useState([]); // array of {speaker, text}
    const [livePartial, setLivePartial] = useState({ speaker: '', text: '' });
    const wsRef = useRef(null); // Keep websocket reference for cleanup
    const mediaRecorderRef = useRef(null); // For cleanup of recorder

    // Dummy patient/meeting info (replace with real info!)
    const participantRole = userName && userName.toLowerCase().includes('doctor') ? 'Doctor' : 'Patient';

    const handleMute = () => {
        if (!audioVideo) return;
        if (muted) {
            audioVideo.realtimeUnmuteLocalAudio();
        } else {
            audioVideo.realtimeMuteLocalAudio();
        }
        setMuted(!muted);
    };

    const handleVideo = () => {
        if (!audioVideo) return;
        if (videoOn) {
            audioVideo.stopLocalVideoTile();
        } else {
            audioVideo.startLocalVideoTile();
        }
        setVideoOn(!videoOn);
    };

    const handleLeave = async () => {
        await meetingManager.leave();
        window.location.href = '/'; // or your desired route
    };

    // ••• 1) Join once on mount •••
    useEffect(() => {
        if (hasJoined.current) return;
        hasJoined.current = true;

        (async () => {
            try {
                const data = meetingData;
                const configuration = new MeetingSessionConfiguration(
                    data.Meeting,
                    data.Attendee
                );

                await meetingManager.join(configuration);
                await meetingManager.start();
            } catch (err) {
                console.error('Error joining room:', err);
            }
        })();

        return () => {
            meetingManager.leave();
        };
    }, [meetingData, meetingManager, roomId, userName]);

    // ••• 2) Start video as soon as we detect a camera •••
    useEffect(() => {
        if (!audioVideo || videoDevices.length === 0) return;

        const device = videoDevices[0];
        audioVideo
            .startVideoInput(device.deviceId)
            .then(() => {
                toggleVideo();
                console.log('Local video started');
            })
            .catch((e) => console.error('Could not start video input', e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioVideo, videoDevices]);

    useEffect(() => {
        // Start transcription only if showTranscript is enabled
        if (!showTranscript) return;

        // 1. Open websocket to backend
        const ws = new window.WebSocket('ws://localhost:3000'); // use wss:// in production!
        wsRef.current = ws;

        // 2. On open, send initial config
        ws.onopen = () => {
            ws.send(JSON.stringify({
                languageCode: 'en-US', // Or whatever you use
                sampleRate: 16000,     // Should match your backend & AWS config
                sessionId: roomId,     // Optional, for grouping
                speaker: userName || 'Anonymous' // e.g. "Steven" or "Doctor"
            }));
        };

        // 3. Listen for transcript updates from backend
        ws.onmessage = (event) => {
            try {
                const { transcript, isPartial, speaker } = JSON.parse(event.data);
                if (isPartial) {
                    setLivePartial({ speaker, text: transcript });
                } else {
                    setTranscriptLog(prev => [...prev, { speaker, text: transcript }]);
                    setLivePartial({ speaker: '', text: '' });
                }
            } catch (err) {
                console.error("Transcript parse error", err);
            }
        };

        // 4. Setup MediaRecorder to capture mic and send to backend
        let mediaRecorder;
        let audioStream;

        async function startRecording() {
            try {
                // Get user's audio (mic)
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new window.MediaRecorder(audioStream, { mimeType: 'audio/webm' }); // webm for MVP

                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.addEventListener('dataavailable', async (event) => {
                    if (event.data.size > 0 && ws.readyState === 1) {
                        // For MVP, just send webm blob. For prod, you must convert to PCM.
                        const arrayBuffer = await event.data.arrayBuffer();
                        ws.send(arrayBuffer); // The backend should decode or convert as needed.
                    }
                });

                mediaRecorder.start(250); // send every 250ms
            } catch (err) {
                console.error('Could not start media recorder', err);
            }
        }

        startRecording();

        // --- Cleanup on component unmount or when transcript panel is closed ---
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
            if (wsRef.current && wsRef.current.readyState === 1) {
                wsRef.current.close();
            }
        };
    }, [showTranscript, roomId, userName]);

    return (
        <Box sx={{
            height: '100vh',
            bgcolor: '#f4fafd',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Top AppBar with controls */}
            <AppBar position="static" elevation={1} sx={{ bgcolor: '#00b4d8' }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        MedLink Video Call
                    </Typography>
                    <IconButton color="inherit" onClick={() => setShowChat(!showChat)}>
                        <ChatIcon />
                    </IconButton>
                    <IconButton color="inherit" onClick={() => setShowTranscript(!showTranscript)}>
                        <SubtitlesIcon />
                    </IconButton>
                    <IconButton color="inherit" onClick={() => setInfoOpen(!infoOpen)}>
                        <InfoIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Meeting Info - collapsible */}
            <Collapse in={infoOpen}>
                <Paper sx={{ p: 2, m: 2, bgcolor: '#e0f7fa' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <InfoIcon color="info" />
                        <Typography variant="subtitle1">
                            Room: <b>{roomId}</b> &nbsp; | &nbsp; You are: <b>{participantRole}</b>
                        </Typography>
                    </Box>
                </Paper>
            </Collapse>

            <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {/* Video Grid */}
                <Box sx={{
                    flex: 1, // shrink when panel is open
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'flex 0.3s',
                    p: 2,
                    minWidth: 0
                }}>
                    <Box sx={{
                        width: '100%',
                        height: '75vh',
                        maxWidth: 1400,
                        mx: 'auto',
                        borderRadius: 4,
                        boxShadow: 2,
                        bgcolor: '#fff',
                        overflow: 'hidden'
                    }}>
                        <VideoTileGrid className="chime-video-tile" />
                    </Box>
                </Box>

                {/* Right Side Panel: Chat or Transcript */}
                {(showChat || showTranscript) && (
                    <Box sx={{
                        width: 340,
                        bgcolor: '#f4fafd',
                        borderLeft: '1px solid #e0e0e0',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        transition: 'width 0.3s',
                        minWidth: 0
                    }}>
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {showChat ? "Chat" : "Transcription"}
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <Box sx={{ flex: 1, overflowY: 'auto', mb: showChat ? 2 : 0 }}>
                                {showChat ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Chat goes here.
                                    </Typography>
                                ) : (
                                    <Box>
                                        {transcriptLog.map((entry, i) => (
                                            <Typography key={i} variant="body2">
                                                <b>{entry.speaker}:</b> {entry.text}
                                            </Typography>
                                        ))}
                                        {livePartial.text && (
                                            <Typography variant="body2" style={{ opacity: 0.7 }}>
                                                <b>{livePartial.speaker}:</b> <i>{livePartial.text}</i>
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                            {showChat && (
                                <Box sx={{}}>
                                    {/* TODO: Chat input here */}
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Bottom Controls */}
            <Paper elevation={3} sx={{
                p: 2,
                bgcolor: '#e0f7fa',
                display: 'flex',
                justifyContent: 'center',
                gap: 3
            }}>
                <IconButton color={muted ? "error" : "primary"} onClick={handleMute}>
                    {muted ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
                <IconButton color={videoOn ? "primary" : "error"} onClick={handleVideo}>
                    {videoOn ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
                <IconButton color="primary">
                    <ScreenShareIcon />
                </IconButton>
                <IconButton color="error" onClick={handleLeave}>
                    <CallEndIcon />
                </IconButton>
            </Paper>
        </Box>
    );
}
