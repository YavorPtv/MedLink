import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './components/LandingPage/LandingPage';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Dashboard from './components/Dashboard/Dashboard';
import VideoCallRoom from './components/VideoCallRoom/VideoCallRoom';
import ImageAnnotation from './components/ImageAnnotation/ImageAnnotation';
import Transcripts from './components/Transcripts/Transcripts';
import Profile from './components/Profile/Profile';
import Navbar from './components/Navbar/Navbar';
import { ThemeProvider } from 'styled-components';
import {
  MeetingProvider,
  AudioVideoProvider,
} from 'amazon-chime-sdk-component-library-react';

function App() {
	return (
		<Router>
			<header className="header_section">
				<div className="container">
					<Navbar />
				</div>
			</header>
			<Routes>
				{/* Public routes */}
				<Route path="/" element={<LandingPage />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/call" element={
					<AudioVideoProvider>
						<VideoCallRoom />
					</AudioVideoProvider>
				} />
				<Route path="/annotate" element={<ImageAnnotation />} />
				<Route path="/transcripts" element={<Transcripts />} />
				<Route path="/profile" element={<Profile />} />

				{/* Catch all - redirect unknown routes to home */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Router>
	);
}

export default App;
