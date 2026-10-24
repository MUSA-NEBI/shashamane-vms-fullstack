import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/dashboardService';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isLoading, setLoading]           = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ limit: 10 });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.pagination?.unreadCount || 0);
    } catch {
      // Notifications are non-critical — silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, isLoading, markRead, markAllRead, refetch: fetchNotifications };
};

export default useNotifications;
