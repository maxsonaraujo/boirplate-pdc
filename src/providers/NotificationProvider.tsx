'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast, UseToastOptions } from '@chakra-ui/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  status: 'info' | 'warning' | 'success' | 'error';
  duration?: number;
  isClosable?: boolean;
}

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const toast = useToast();

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Mostrar toast para notificação
    toast({
      title: notification.title,
      description: notification.message,
      status: notification.status,
      duration: notification.duration || 5000,
      isClosable: notification.isClosable !== false,
      position: 'bottom-right',
    });
    
    return id;
  }, [toast]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Limpar automaticamente notificações após serem mostradas
  useEffect(() => {
    notifications.forEach(notification => {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration || 5000);
      
      return () => clearTimeout(timer);
    });
  }, [notifications, removeNotification]);

  return (
    <NotificationContext.Provider value={{ 
      addNotification, 
      removeNotification, 
      notifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  
  return context;
}
