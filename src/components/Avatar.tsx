import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Avatar as HeroAvatar,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Spinner,
} from "@heroui/react";
import { addToast } from "@heroui/toast";

import { uploadAvatar, deleteAvatar } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  isBordered?: boolean;
  isEditable?: boolean;
  onAvatarChange?: (avatarUrl: string | null) => void;
}

export default function Avatar({
  src,
  name,
  size = "md",
  color = "default",
  isBordered = false,
  isEditable = false,
  onAvatarChange,
}: AvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(src);
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, updateUser } = useAuth();

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      // 验证文件类型
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];

      if (!allowedTypes.includes(file.type)) {
        addToast({
          title: "文件格式错误",
          description: "请选择JPG、PNG或GIF格式的图片",
          color: "warning",
          timeout: 4000,
          shouldShowTimeoutProgress: true,
        });

        return;
      }

      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          title: "文件过大",
          description: "头像文件大小不能超过5MB",
          color: "warning",
          timeout: 4000,
          shouldShowTimeoutProgress: true,
        });

        return;
      }

      setIsUploading(true);
      try {
        const response = await uploadAvatar(file);
        const newAvatarUrl = response.avatar_url;

        setCurrentAvatar(newAvatarUrl || undefined);
        onAvatarChange?.(newAvatarUrl);

        // 更新用户信息
        if (user) {
          updateUser({ avatar: newAvatarUrl });
        }

        addToast({
          title: "上传成功",
          description: "头像上传成功！",
          color: "success",
          timeout: 3000,
          shouldShowTimeoutProgress: true,
        });
      } catch (error) {
        console.error("上传头像失败:", error);
        addToast({
          title: "上传失败",
          description: `上传头像失败: ${error instanceof Error ? error.message : "未知错误"}`,
          color: "danger",
          timeout: 5000,
          shouldShowTimeoutProgress: true,
        });
      } finally {
        setIsUploading(false);
        // 清空文件输入，允许重新选择同一个文件
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onAvatarChange, user, updateUser],
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDeleteAvatar = useCallback(() => {
    if (!currentAvatar) return;
    setShowDeleteConfirm(true);
  }, [currentAvatar]);

  const confirmDeleteAvatar = useCallback(async () => {
    setIsUploading(true);
    try {
      await deleteAvatar();
      setCurrentAvatar(undefined);
      onAvatarChange?.(null);

      // 更新用户信息
      if (user) {
        updateUser({ avatar: null });
      }

      addToast({
        title: "删除成功",
        description: "头像删除成功！",
        color: "success",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("删除头像失败:", error);
      addToast({
        title: "删除失败",
        description: `删除头像失败: ${error instanceof Error ? error.message : "未知错误"}`,
        color: "danger",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    } finally {
      setIsUploading(false);
    }
  }, [onAvatarChange, user, updateUser]);

  // 构建菜单项
  const menuItems = useMemo(() => {
    const items = [
      {
        key: "upload",
        label: "上传头像",
        icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
        action: handleUploadClick,
      },
    ];

    if (currentAvatar) {
      items.push({
        key: "delete",
        label: "删除头像",
        icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
        action: handleDeleteAvatar,
      });
    }

    return items;
  }, [currentAvatar, handleUploadClick, handleDeleteAvatar]);

  if (!isEditable) {
    return (
      <HeroAvatar
        color={color}
        isBordered={isBordered}
        name={name}
        size={size}
        src={currentAvatar}
      />
    );
  }

  return (
    <div
      className="relative inline-block group"
      onMouseEnter={() => setShowEditOverlay(true)}
      onMouseLeave={() => setShowEditOverlay(false)}
    >
      <input
        ref={fileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        type="file"
        onChange={handleFileSelect}
      />

      <div className="relative">
        <HeroAvatar
          color={color}
          isBordered={isBordered}
          name={name}
          size={size}
          src={currentAvatar}
        />

        {/* 加载状态 */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Spinner
              classNames={{ circle1: "border-white", circle2: "border-white" }}
              color="default"
              size="sm"
            />
          </div>
        )}

        {/* 编辑悬停覆盖层 */}
        {showEditOverlay && !isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="h-8 w-8"
                  color="primary"
                  size="sm"
                  variant="solid"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </Button>
              </DropdownTrigger>

              <DropdownMenu aria-label="头像操作" items={menuItems}>
                {(item) => (
                  <DropdownItem
                    key={item.key}
                    className={item.key === "delete" ? "text-danger" : ""}
                    color={item.key === "delete" ? "danger" : "default"}
                    onPress={item.action}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d={item.icon}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                      {item.label}
                    </div>
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        )}
      </div>

      {/* 编辑提示 */}
      {!showEditOverlay && !isUploading && (
        <Tooltip content="悬停编辑头像">
          <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
        </Tooltip>
      )}

      {/* 删除确认Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        message="确定要删除当前头像吗？删除后将显示默认头像。"
        title="删除头像"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAvatar}
      />
    </div>
  );
}
