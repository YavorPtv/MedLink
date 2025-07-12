import { useEffect, useRef } from "react";

export default function VideoCallRoom() {
    const videoRef = useRef();

    useEffect(() => {
        async function startVideo() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoRef.current.srcObject = stream;
            } catch (err) {
                console.error('Failed to get media', err);
            }
        }

        startVideo();
    }, []);

    return <video ref={videoRef} autoPlay muted />;
}