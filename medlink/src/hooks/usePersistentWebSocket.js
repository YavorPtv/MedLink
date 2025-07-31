import { useEffect, useRef, useState, useCallback } from "react";

// Usage: 
// const { ws, connected, sendJson, sendRaw, lastJsonMessage, lastRawMessage } = usePersistentWebSocket(url, { onJsonMessage, onRawMessage });

export function usePersistentWebSocket(
    url,
    {
        onJsonMessage,
        onRawMessage,
        protocols,
        reconnectInterval = 3000, // ms
        autoReconnect = true,
        onOpen,
        onClose,
        onError,
        sessionInitJson,
        showTranscript //! change for prod
    } = {}
) {
    const wsRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [lastJsonMessage, setLastJsonMessage] = useState(null);
    const [lastRawMessage, setLastRawMessage] = useState(null);

    // To prevent multiple reconnections
    const reconnectTimeoutRef = useRef(null);
    const shouldReconnectRef = useRef(true);

    const connect = useCallback(() => {
        if (!shouldReconnectRef.current) {
            console.log("WebSocket: not reconnecting (component unmounted)");
            return;
        }
        console.log("WebSocket: attempting connection to", url);
        const ws = new WebSocket(url, protocols);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            console.log("WebSocket: connection OPEN");
            if (sessionInitJson) {
                ws.send(JSON.stringify(sessionInitJson));
            }
            if (onOpen) onOpen();
        };

        ws.onclose = (e) => {
            setConnected(false);
            console.log("WebSocket: connection CLOSED", e.code, e.reason);
            if (onClose) onClose(e);
            // Reconnect logic
            if (autoReconnect && !reconnectTimeoutRef.current) {
                console.log("WebSocket: scheduling RECONNECT in", reconnectInterval, "ms");
                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectTimeoutRef.current = null;
                    connect();
                }, reconnectInterval);
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket: ERROR", err);
            if (onError) onError(err);
            ws.close();
        };

        ws.onmessage = (event) => {
            // Try to parse as JSON first, else pass as raw data
            try {
                const json = JSON.parse(event.data);
                setLastJsonMessage(json);
                if (onJsonMessage) onJsonMessage(json);
            } catch {
                setLastRawMessage(event.data);
                if (onRawMessage) onRawMessage(event.data);
            }
        };
    }, [url, protocols, sessionInitJson, onOpen, onClose, autoReconnect, reconnectInterval, onError, onJsonMessage, onRawMessage]);

    useEffect(() => {
        if (!showTranscript) return; //! change for prod
        shouldReconnectRef.current = true;
        connect();
        return () => {
            shouldReconnectRef.current = false;
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect, showTranscript]); //! change for prod

    // Sending helpers
    const sendJson = useCallback((obj) => {
        if (wsRef.current && wsRef.current.readyState === 1) {
            wsRef.current.send(JSON.stringify(obj));
        }
    }, []);

    const sendRaw = useCallback((data) => {
        if (wsRef.current && wsRef.current.readyState === 1) {
            wsRef.current.send(data);
        }
    }, []);

    return { ws: wsRef.current, connected, sendJson, sendRaw, lastJsonMessage, lastRawMessage };
}
