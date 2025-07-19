import { useState, useEffect } from 'react';
import VideoCallRoom from '../VideoCallRoom/VideoCallRoom';
import { Card, CardContent, Typography, TextField, Button, Divider, List, ListItem, ListItemText } from '@mui/material';

function generateRoomId() {
    return 'room-' + Math.random().toString(36).substr(2, 9);
}

export default function MeetingLobby() {
    const [hasJoined, setHasJoined] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [userName, setUserName] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [meetingList, setMeetingList] = useState([]);
    const [meetingData, setMeetingData] = useState(null);

    // For this demo, we'll keep previous meetings in localStorage
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('medlink_meetings') || '[]');
        setMeetingList(saved);
    }, []);

    function saveMeeting(id) {
        const saved = JSON.parse(localStorage.getItem('medlink_meetings') || '[]');
        if (!saved.includes(id)) {
            saved.unshift(id);
            localStorage.setItem('medlink_meetings', JSON.stringify(saved.slice(0, 10)));
            setMeetingList(saved.slice(0, 10));
        }
    }

    const handleCreateMeeting = async () => {
        const newRoomId = generateRoomId();
        const name = userName || `user-${Date.now()}`;
        const res = await fetch('http://localhost:5000/join-meeting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: newRoomId, userName: name, mode: "create" }),
        });
        if (res.ok) {
            const data = await res.json();
            setMeetingData(data);
            setRoomId(newRoomId);
            setHasJoined(true);
            saveMeeting(newRoomId);
        } else {
            alert('Failed to create meeting');
        }
    };

    const handleJoinMeeting = async () => {
        if (!joinRoomId) {
            alert('Enter a Room ID');
            return;
        }
        const name = userName || `user-${Date.now()}`;
        const res = await fetch('http://localhost:5000/join-meeting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: joinRoomId, userName: name, mode: "join" }),
        });
        if (res.ok) {
            const data = await res.json();
            setMeetingData(data);
            setRoomId(joinRoomId);
            setHasJoined(true);
            saveMeeting(joinRoomId);
        } else {
            alert('Meeting not found. Please check the Room ID.');
        }
    };

    if (hasJoined && meetingData) {
        // Pass the data as props
        return (
            <VideoCallRoom
                meetingData={meetingData}
                userName={userName}
                roomId={roomId}
            />
        );
    }

    return (
        <Card sx={{ maxWidth: 700, mx: 'auto', mt: 8, boxShadow: 3 }}>
            <CardContent>
                <Typography variant="h5" fontWeight="bold" mb={2}>Start or Join a Meeting</Typography>
                <TextField
                    label="Your Name"
                    fullWidth
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    margin="normal"
                />
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mb: 2 }}
                    onClick={handleCreateMeeting}
                >
                    Create Meeting
                </Button>
                <Divider sx={{ my: 2 }}>or</Divider>
                <TextField
                    label="Enter Room ID to Join"
                    fullWidth
                    value={joinRoomId}
                    onChange={e => setJoinRoomId(e.target.value)}
                    margin="normal"
                />
                <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    sx={{ mb: 2 }}
                    onClick={handleJoinMeeting}
                >
                    Join
                </Button>
                <Typography variant="subtitle1" mt={4} mb={1}>Previous Meetings</Typography>
                <List>
                    {meetingList.length === 0 && (
                        <ListItem>
                            <ListItemText primary="No previous meetings" />
                        </ListItem>
                    )}
                    {meetingList.map(id => (
                        <ListItem key={id} secondaryAction={
                            <Button size="small" onClick={() => { setJoinRoomId(id); handleJoinMeeting(); }}>
                                Rejoin
                            </Button>
                        }>
                            <ListItemText primary={id} />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
}
