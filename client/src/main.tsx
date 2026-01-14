import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler to catch API-related errors
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && event.error.message.includes('getBaseURL')) {
    console.error('API Error intercepted:', event.error);
    console.warn('This error might be caused by browser extension or debugging code');
    event.preventDefault(); // Prevent the error from bubbling up
  }
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('getBaseURL')) {
    console.error('API Promise rejection intercepted:', event.reason);
    console.warn('This error might be caused by browser extension or debugging code');
    event.preventDefault(); // Prevent the error from bubbling up
  }
});

createRoot(document.getElementById("root")!).render(<App />);
