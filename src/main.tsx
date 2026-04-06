import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force HTTPS Redirection for Security
if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
  window.location.href = window.location.href.replace('http:', 'https:');
}

createRoot(document.getElementById("root")!).render(<App />);
