import React, { useEffect, useRef } from 'react';
import {
    ConsoleLogger,
    DefaultDeviceController,
    DefaultMeetingSession,
    LogLevel,
    MeetingSessionConfiguration,
} from 'amazon-chime-sdk-js';

export default function VideoCallRoom() {
    const videoTilesRef = useRef({});
    const sessionRef = useRef(null);
    const videoObserverRef = useRef(null);

    useEffect(() => {
        const joinRoom = async () => {
            try {
                const uniqueUserName = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const res = await fetch('http://localhost:5000/create-meeting', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId: 'my-room-1', userName: uniqueUserName }),
                });

                const data = await res.json();

                const logger = new ConsoleLogger('ChimeLogs', LogLevel.INFO);
                const deviceController = new DefaultDeviceController(logger);
                const configuration = new MeetingSessionConfiguration(data.Meeting, data.Attendee);
                const meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);

                sessionRef.current = meetingSession;

                const audioVideo = meetingSession.audioVideo;
                await audioVideo.start();  // join the meeting first!

                // List video devices and pick one
                const videoDevices = await deviceController.listVideoInputDevices();
                const chosenDeviceId = videoDevices[0]?.deviceId;

                // Start video input and local video tile
                await audioVideo.startVideoInput(chosenDeviceId);
                audioVideo.startLocalVideoTile();

                // Observer for video tiles
                const videoObserver = {
                    videoTileDidUpdate: (tileState) => {
                        // Ignore if no bound attendee or tileId
                        if (!tileState.boundAttendeeId || !tileState.tileId) return;
                        if (tileState.isContent) return; // skip content share tiles

                        let videoElement = videoTilesRef.current[tileState.tileId];

                        if (!videoElement) {
                            const container = document.getElementById('video-tiles');
                            if (!container) return; // safety check

                            videoElement = document.createElement('video');
                            videoElement.autoplay = true;
                            videoElement.muted = tileState.localTile; // mute local to avoid echo
                            videoElement.style.width = '300px';
                            videoElement.style.margin = '10px';

                            container.appendChild(videoElement);
                            videoTilesRef.current[tileState.tileId] = videoElement;
                        }

                        audioVideo.bindVideoElement(tileState.tileId, videoElement);
                    },

                    videoTileWasRemoved: (tileId) => {
                        const videoElement = videoTilesRef.current[tileId];
                        if (videoElement) {
                            videoElement.remove();
                            delete videoTilesRef.current[tileId];
                        }
                    },
                };

                videoObserverRef.current = videoObserver;
                audioVideo.addObserver(videoObserver);

            } catch (err) {
                console.error('Error joining room', err);
            }
        };

        joinRoom();

        return () => {
            const currentSession = sessionRef.current;
            if (currentSession) {
                const audioVideo = currentSession.audioVideo;
                if (audioVideo) {
                    if (videoObserverRef.current) {
                        audioVideo.removeObserver(videoObserverRef.current);
                        videoObserverRef.current = null;
                    }
                    audioVideo.stopLocalVideoTile();
                    audioVideo.stop();
                }
            }
        };
    }, []);

    return (
        <div>
            <h1>Video Call Room</h1>
            <div id="video-tiles" style={{ display: 'flex', flexWrap: 'wrap' }}></div>
        </div>
    );
}
