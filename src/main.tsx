import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// 导入 stream polyfill 以解决 xlsx-js-style 的兼容性问题
import "./utils/streamPolyfill.js";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import { AuthProvider } from "@/context/AuthContext";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <Provider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </BrowserRouter>,
);
