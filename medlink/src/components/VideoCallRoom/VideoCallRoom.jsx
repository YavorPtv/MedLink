import { useEffect, useRef } from "react";
import { io } from 'socket.io-client';

const SERVER_URL = "http://localhost:5000";
const ROOM_ID = "test-room"; // In real apps, generate or get from URL

export default function VideoCallRoom() {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const pcRef = useRef();
    const socketRef = useRef();

    useEffect(() => {
        socketRef.current = io(SERVER_URL);

        // Setup peer connection
        pcRef.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // When ICE candidates are found, send them to peer
        pcRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate:", event.candidate);
                socketRef.current.emit("ice-candidate", {
                    roomId: ROOM_ID,
                    candidate: event.candidate,
                });
            }
        };

        // When remote track arrives, show it in remote video element
        pcRef.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Get local media and add tracks to peer connection
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                stream.getTracks().forEach((track) => {
                    pcRef.current.addTrack(track, stream);
                });
                // Join room
                socketRef.current.emit("join-room", ROOM_ID);
            });

        // Someone joined room, create and send offer
        socketRef.current.on("user-joined", async () => {
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            socketRef.current.emit("offer", { roomId: ROOM_ID, sdp: offer });
        });

        // Receive offer, create answer
        socketRef.current.on("offer", async (data) => {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socketRef.current.emit("answer", { roomId: ROOM_ID, sdp: answer });
        });

        // Receive answer and set remote description
        socketRef.current.on("answer", async (data) => {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        });

        // Receive ICE candidate and add it to peer connection
        socketRef.current.on("ice-candidate", async (data) => {
            console.log("Received ICE candidate:", data.candidate);
            try {
                await pcRef.current.addIceCandidate(data.candidate);
            } catch (e) {
                console.error("Error adding received ice candidate", e);
            }
        });

        return () => {
            socketRef.current.disconnect();
            pcRef.current.close();
        };
    }, []);

    return (
        <div style={{ display: "flex", gap: 10 }}>
            <div>
                <h3>Local Video</h3>
                <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 300, border: "1px solid black" }} />
            </div>
            <div>
                <h3>Remote Video</h3>
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 300, border: "1px solid black" }} />
            </div>
        </div>
    );
}