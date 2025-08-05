import React, { useState, useEffect } from "react";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";

import { getUserInfo, isAuthenticated, login, logout } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function TestAuth() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [apiResult, setApiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuth();

  const analyzeToken = () => {
    const token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (token) {
      try {
        const base64Payload = token.split(".")[1];
        const payload = JSON.parse(atob(base64Payload));
        const now = Math.floor(Date.now() / 1000);

        setTokenInfo({
          hasToken: !!token,
          hasRefreshToken: !!refreshToken,
          tokenLength: token.length,
          refreshTokenLength: refreshToken?.length,
          payload: payload,
          isExpired: payload.exp < now,
          issuedAt: new Date(payload.iat * 1000).toLocaleString(),
          expiresAt: new Date(payload.exp * 1000).toLocaleString(),
          timeUntilExpiry: payload.exp - now,
          currentTime: new Date().toLocaleString(),
        });
      } catch (error) {
        setTokenInfo({ error: "Failed to decode token", rawError: error });
      }
    } else {
      setTokenInfo({ hasToken: false });
    }
  };

  const testUserInfo = async () => {
    setLoading(true);
    try {
      const userInfo = await getUserInfo();

      setApiResult({ success: true, data: userInfo });
    } catch (error: any) {
      setApiResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const result = await login({ username: "admin", password: "admin123" });

      setApiResult({ success: true, loginResult: result });
      analyzeToken();
    } catch (error: any) {
      setApiResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setTokenInfo(null);
    setApiResult(null);
  };

  useEffect(() => {
    analyzeToken();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Debug Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Token Information</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-2">
              <Button size="sm" onClick={analyzeToken}>
                Refresh Token Info
              </Button>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(tokenInfo, null, 2)}
              </pre>
            </div>
          </CardBody>
        </Card>

        {/* API Test Results */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">API Test Results</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  color="primary"
                  disabled={loading}
                  size="sm"
                  onClick={testUserInfo}
                >
                  Test Get User Info
                </Button>
                <Button
                  color="secondary"
                  disabled={loading}
                  size="sm"
                  onClick={testLogin}
                >
                  Test Login
                </Button>
                <Button color="danger" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </div>
          </CardBody>
        </Card>

        {/* Auth Context Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold">Auth Context Information</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-2">
              <p>
                <strong>Is Authenticated (isAuthenticated()):</strong>{" "}
                {isAuthenticated().toString()}
              </p>
              <p>
                <strong>Auth Context User:</strong>
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(user, null, 2)}
              </pre>
              <Button size="sm" onClick={refreshUser}>
                Refresh User
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
