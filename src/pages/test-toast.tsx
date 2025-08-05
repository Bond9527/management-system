import React, { useState } from "react";
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";
import { addToast } from "@heroui/toast";

import { forgotPassword } from "@/services/api";

export default function TestToastPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const testToast = () => {
    addToast({
      title: "成功消息",
      description: "这是一个成功的操作",
      color: "success",
      timeout: 3000,
    });

    setTimeout(() => {
      addToast({
        title: "错误消息",
        description: "这是一个错误的操作",
        color: "danger",
        timeout: 5000,
      });
    }, 500);

    setTimeout(() => {
      addToast({
        title: "普通消息",
        description: "这是一个普通的提示",
        color: "primary",
        timeout: 4000,
      });
    }, 1000);
  };

  const testForgotPassword = async (testUsername: string) => {
    try {
      setIsLoading(true);
      const response = await forgotPassword({ username: testUsername });

      addToast({
        title: "验证成功",
        description: `账号验证成功: ${response.username}`,
        color: "success",
        timeout: 3000,
      });
    } catch (error: any) {
      console.error("错误:", error);
      addToast({
        title: "验证失败",
        description: error.message || "验证失败",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Toast测试</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Button className="w-full" color="primary" onPress={testToast}>
              测试Toast显示
            </Button>

            <div className="space-y-2">
              <Input
                label="测试账号"
                placeholder="输入要测试的账号"
                value={username}
                onValueChange={setUsername}
              />

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  color="success"
                  isLoading={isLoading}
                  size="sm"
                  onPress={() => testForgotPassword("admin")}
                >
                  测试存在账号
                </Button>
                <Button
                  className="flex-1"
                  color="danger"
                  isLoading={isLoading}
                  size="sm"
                  onPress={() => testForgotPassword("nonexistent")}
                >
                  测试不存在账号
                </Button>
              </div>

              {username && (
                <Button
                  className="w-full"
                  isLoading={isLoading}
                  size="sm"
                  variant="flat"
                  onPress={() => testForgotPassword(username)}
                >
                  测试自定义账号
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
