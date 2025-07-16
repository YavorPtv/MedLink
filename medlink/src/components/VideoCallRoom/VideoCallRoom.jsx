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

export default function VideoCallRoom() {
    const meetingManager = useMeetingManager();
    const audioVideo = useAudioVideo();
    const { toggleVideo } = useLocalVideo();
    const { devices: videoDevices } = useVideoInputs();
    const hasJoined = useRef(false);

    // ••• 1) Join once on mount •••
    useEffect(() => {
        if (hasJoined.current) return;
        hasJoined.current = true;

        (async () => {
            try {
                const userName = `user-${Date.now()}`;
                const res = await fetch('http://localhost:5000/create-meeting', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId: 'my-room-2', userName }),
                });
                const data = await res.json();
                console.log("MEETING DATA RECEIVED:", data);

                const configuration = new MeetingSessionConfiguration(
                    {
                        Meeting: {
                            MeetingId: data.Meeting.MeetingId,
                            ExternalMeetingId: data.Meeting.ExternalMeetingId,
                            MediaRegion: data.Meeting.MediaRegion,
                            MediaPlacement: data.Meeting.MediaPlacement
                        }
                    },
                    {
                        Attendee: {
                            AttendeeId: data.Attendee.AttendeeId,
                            ExternalUserId: data.Attendee.ExternalUserId,
                            JoinToken: data.Attendee.JoinToken
                        }
                    }
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
    }, [meetingManager]);

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
        <div>
            {/* <h1>Video Call Room (React SDK)</h1> */}
            {/* <div className="video-container">
                <LocalVideo className="chime-local-video" />
            </div> */}
            <div className="video-grid-container">
                <VideoTileGrid className="chime-video-tile" />
            </div>
        </div>
    );
}
