import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './components/LandingPage/LandingPage';
// import LoginPage from './components/LoginPage/LoginPage';
// import RegisterPage from './components/RegisterPage/RegisterPage';
// import Dashboard from './components/Dashboard/Dashboard';
import VideoCallRoom from './components/VideoCallRoom/VideoCallRoom';
// import ImageAnnotation from './components/ImageAnnotation/ImageAnnotation';
// import Transcripts from './components/Transcripts/Transcripts';
// import Profile from './components/Profile/Profile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/register" element={<RegisterPage />} /> */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/call" element={<VideoCallRoom />} />
        {/* <Route path="/annotate/:imageId" element={<ImageAnnotation />} /> */}
        {/* <Route path="/transcripts/:callId" element={<Transcripts />} /> */}
        {/* <Route path="/profile" element={<Profile />} /> */}

        {/* Catch all - redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
