import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "leaflet/dist/leaflet.css";
import "./styles/global.css";

import { App } from "./App";
import { getPublicBasePath } from "./lib/env";

/**
 * BrowserRouter basename:
 * - In Kavia proxy environments, the app can be served under /proxy/3000
 * - We derive it from REACT_APP_PUBLIC_URL when provided.
 */
const basename = getPublicBasePath();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
