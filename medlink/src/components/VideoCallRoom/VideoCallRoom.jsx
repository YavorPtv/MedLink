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

export default function VideoCallRoom({ meetingData, roomId, userName }) {
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
