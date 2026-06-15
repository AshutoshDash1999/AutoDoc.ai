import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from './App';
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { optimizeResourceHints, monitorPerformance } from "./utils/performanceOptimization.js";
import "./styles/theme.css";

// Optimize resource hints based on connection speed
optimizeResourceHints();

// Monitor performance metrics
const metrics = monitorPerformance();

// Log performance in development
if (import.meta.env.DEV) {
  console.log("Performance metrics enabled");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
