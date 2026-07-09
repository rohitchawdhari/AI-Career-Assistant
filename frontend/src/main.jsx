import React from "react";
import ReactDOM from "react-dom/client";

// Vercel build trigger for dynamic VITE_GOOGLE_CLIENT_ID environment variable
import App from "./App";
import "./index.css";

import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);