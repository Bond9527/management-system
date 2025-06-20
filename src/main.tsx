import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import { SuppliesProvider } from "@/context/SuppliesContext";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <AuthProvider>
          <SuppliesProvider>
            <App />
          </SuppliesProvider>
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);
