import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { AppBootstrap } from "@/app/app-bootstrap";
import { AppRoutes } from "@/app/router";
import "@/app/styles/index.css";
import { FeedbackToaster } from "@/widgets/feedback-toaster";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <AppBootstrap />
            <AppRoutes />
            <FeedbackToaster />
        </BrowserRouter>
    </React.StrictMode>,
);
