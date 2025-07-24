import { useRef, useEffect, useState } from "react";
import { Box, Typography, TextField, IconButton, Paper, Stack } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

// Dummy current user (replace with real auth/session info)
const CURRENT_USER = {
    id: "user1",
    name: "You",
};

export default function ChatPanel({ currentUser = CURRENT_USER, messages, onSend }) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle send
    const handleSend = () => {
        if (input.trim() === "") return;
        onSend({
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: input,
            timestamp: new Date().toISOString(),
        });
        setInput("");
    };

    // Enter to send, Shift+Enter for newline
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Paper elevation={3} sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            p: 2,
            minWidth: 320,
            maxWidth: 400,
            bgcolor: "#fafbfc"
        }}>
            <Typography variant="h6" sx={{ mb: 1, color: "#1976d2" }}>
                Chat
            </Typography>
            <Box sx={{
                flex: 1,
                overflowY: "auto",
                mb: 1,
                pr: 1,
                bgcolor: "#f5f8fa",
                borderRadius: 2
            }}>
                <Stack spacing={1}>
                    {messages.map((msg, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: msg.senderId === currentUser.id ? "flex-end" : "flex-start"
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: msg.senderId === currentUser.id ? "#e3f2fd" : "#e8f5e9",
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2,
                                    maxWidth: "80%",
                                    boxShadow: 1,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#888",
                                        fontWeight: 500,
                                        mb: 0.5,
                                    }}
                                >
                                    {msg.senderId === currentUser.id ? "You" : msg.senderName}
                                </Typography>
                                <Typography variant="body2">{msg.text}</Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ color: "#bbb", fontSize: "0.7em", float: "right" }}
                                >
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                    <div ref={messagesEndRef} />
                </Stack>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                    multiline
                    minRows={1}
                    maxRows={4}
                    fullWidth
                    placeholder="Type your message…"
                    variant="outlined"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    sx={{
                        bgcolor: "#fff",
                        borderRadius: 2,
                    }}
                />
                <IconButton color="primary" onClick={handleSend} disabled={input.trim() === ""}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Paper>
    );
}
