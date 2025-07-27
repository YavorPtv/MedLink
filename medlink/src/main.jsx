import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LoggerProvider } from 'amazon-chime-sdk-component-library-react';
import App from './App.jsx'
import {
    MeetingProvider,
    lightTheme,
    GlobalStyles,
} from 'amazon-chime-sdk-component-library-react';

import { ThemeProvider } from 'styled-components';
import { ConsoleLogger, LogLevel } from 'amazon-chime-sdk-js';

const logger = new ConsoleLogger('MedLink', LogLevel.ERROR);

createRoot(document.getElementById('root')).render(
    // <StrictMode>
    <ThemeProvider theme={lightTheme}>
        <LoggerProvider logger={logger}>
            <MeetingProvider>
                <App />
            </MeetingProvider>
        </LoggerProvider>
    </ThemeProvider>
    // </StrictMode>,
)
