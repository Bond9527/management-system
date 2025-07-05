import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  Button,
} from "@heroui/react";
import { TrashIcon } from "@/components/icons";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "确认删除",
  message,
  itemName,
}: DeleteConfirmModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  // 当弹窗打开时启动倒计时
  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setIsCountdownActive(true);
    } else {
      setIsCountdownActive(false);
    }
  }, [isOpen]);

  // 倒计时逻辑
  useEffect(() => {
    if (isCountdownActive && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setIsCountdownActive(false);
    }
  }, [isCountdownActive, countdown]);

  const handleConfirm = () => {
    if (countdown === 0) {
      onConfirm();
      onClose();
    }
  };

  const handleClose = () => {
    setCountdown(5);
    setIsCountdownActive(false);
    onClose();
  };

  const defaultMessage = itemName 
    ? `删除后此操作不可恢复。`
    : "删除后此操作不可恢复。";

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="sm"
      hideCloseButton
    >
      <ModalContent>
        <div className="flex flex-col items-center text-center p-6">
          {/* 垃圾桶图标区域 */}
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-200">
              <TrashIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
          
          {/* 标题 */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>

          {/* 内容区域 */}
          <div className="mb-6 max-w-sm">
            {itemName && (
              <div className="mb-2 p-2 bg-gray-50 rounded border-l-4 border-red-500 inline-block max-w-fit mx-auto">
                <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {itemName}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600 leading-relaxed">
              {message || defaultMessage}
            </p>
          </div>

          {/* 按钮区域 */}
          <div className="flex gap-3 w-full max-w-xs">
            <Button 
              color="default" 
              variant="flat"
              onClick={handleClose}
              className="flex-1 hover:bg-gray-100"
            >
              取消
            </Button>
            <Button 
              color="danger" 
              onClick={handleConfirm}
              disabled={countdown > 0}
              className={`flex-1 ${countdown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {countdown > 0 ? `${countdown}秒后可删除` : '确认删除'}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
} 