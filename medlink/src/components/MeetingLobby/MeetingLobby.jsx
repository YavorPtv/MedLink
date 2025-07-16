import { useState, useEffect } from 'react';
import VideoCallRoom from '../VideoCallRoom/VideoCallRoom';

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
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Start or Join a Meeting</h2>
            <input
                className="w-full mb-2 p-2 border"
                type="text"
                placeholder="Your Name"
                value={userName}
                onChange={e => setUserName(e.target.value)}
            />
            <button
                className="bg-blue-500 text-white p-2 rounded mb-2 w-full"
                onClick={handleCreateMeeting}
            >
                Create Meeting
            </button>
            <div className="flex mb-2">
                <input
                    className="flex-1 p-2 border"
                    type="text"
                    placeholder="Enter Room ID to Join"
                    value={joinRoomId}
                    onChange={e => setJoinRoomId(e.target.value)}
                />
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded ml-2"
                    onClick={handleJoinMeeting}
                >
                    Join
                </button>
            </div>
            <div className="mt-6">
                <h3 className="font-semibold mb-2">Previous Meetings</h3>
                <ul>
                    {meetingList.map(id => (
                        <li key={id} className="border-b py-1 flex justify-between items-center">
                            <span>{id}</span>
                            <button
                                className="text-sm text-blue-500 underline"
                                onClick={() => { setJoinRoomId(id); handleJoinMeeting(); }}
                            >
                                Rejoin
                            </button>
                        </li>
                    ))}
                    {meetingList.length === 0 && <li>No previous meetings</li>}
                </ul>
            </div>
        </div>
    );
}
