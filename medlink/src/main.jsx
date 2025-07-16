import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import {
  MeetingProvider,
  lightTheme,
  GlobalStyles,
} from 'amazon-chime-sdk-component-library-react';

import { ThemeProvider } from 'styled-components';

createRoot(document.getElementById('root')).render(
    // <StrictMode>
    <ThemeProvider theme={lightTheme}>
        <MeetingProvider>
           <App />
        </MeetingProvider>
    </ThemeProvider>
    // </StrictMode>,
)
