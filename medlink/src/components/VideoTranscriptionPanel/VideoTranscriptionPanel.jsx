import { Box, Typography, Paper, Stack } from "@mui/material";
import SubtitlesIcon from "@mui/icons-material/Subtitles";

// Props: roomId, userName, onFinalTranscript (optional callback)
export default function VideoTranscriptionPanel({ 
    transcriptLog, 
    livePartial
}) {
    return (
        <Paper
            elevation={3}
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                p: 2,
                minWidth: 320,
                maxWidth: 400,
                bgcolor: "#fafbfc",
            }}
        >
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <SubtitlesIcon color="primary" />
                <Typography variant="h6" sx={{ color: "#1976d2" }}>
                    Live Transcription
                </Typography>
            </Box>
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    mb: 1,
                    pr: 1,
                    bgcolor: "#f5f8fa",
                    borderRadius: 2,
                }}
            >
                <Stack spacing={1}>
                    {transcriptLog.map((entry, i) => (
                        <Box key={i} sx={{ bgcolor: "#e8f5e9", px: 2, py: 1, borderRadius: 2, boxShadow: 1 }}>
                            <Typography variant="caption" sx={{ color: "#888", fontWeight: 500, mb: 0.5 }}>
                                {entry.speaker}
                            </Typography>
                            <Typography variant="body2">{entry.text}</Typography>
                        </Box>
                    ))}
                    {livePartial.text && (
                        <Box sx={{ bgcolor: "#fffde7", px: 2, py: 1, borderRadius: 2, opacity: 0.8, boxShadow: 0 }}>
                            <Typography variant="caption" sx={{ color: "#888", fontWeight: 500, mb: 0.5 }}>
                                {livePartial.speaker}
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                                {livePartial.text}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Box>
        </Paper>
    );
}
