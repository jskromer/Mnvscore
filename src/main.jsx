import "./polyfills.js";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import MNVScorecard from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <>
    <MNVScorecard />
    <Analytics />
  </>
);
