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

            {/* Main Content: Video grid + panels */}
            <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {/* Video Grid */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
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

                {/* Chat Drawer */}
                <Drawer
                    anchor="right"
                    open={showChat}
                    onClose={() => setShowChat(false)}
                    PaperProps={{ sx: { width: 340, bgcolor: '#f4fafd' } }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6">Chat</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ height: 400, overflowY: 'auto' }}>
                            {/* TODO: Chat messages here */}
                            <Typography variant="body2" color="text.secondary">Chat goes here.</Typography>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            {/* TODO: Chat input here */}
                        </Box>
                    </Box>
                </Drawer>

                {/* Transcript Drawer */}
                <Drawer
                    anchor="right"
                    open={showTranscript}
                    onClose={() => setShowTranscript(false)}
                    PaperProps={{ sx: { width: 340, bgcolor: '#f4fafd' } }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6">Transcription</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ height: 400, overflowY: 'auto' }}>
                            {/* TODO: Real-time transcript here */}
                            <Typography variant="body2" color="text.secondary">Transcript goes here.</Typography>
                        </Box>
                    </Box>
                </Drawer>
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
