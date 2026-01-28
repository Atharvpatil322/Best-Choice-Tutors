/**
 * Socket Context
 * Foundation for WebSocket connection management
 * 
 * Features:
 * - Manages a single WebSocket connection
 * - Connects only when user is authenticated
 * - Disconnects on logout
 * - Reconnects on page refresh if token exists
 * - Uses JWT from localStorage to authenticate socket
 */

import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { getAuthToken, isAuthenticated } from '@/services/authService';

const SocketContext = createContext(null);

/**
 * Get WebSocket server URL from environment or default
 */
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  // Remove /api suffix if present, socket.io typically runs on base URL
  return apiUrl.replace(/\/api$/, '');
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  /**
   * Connect to WebSocket server
   */
  const connect = () => {
    // Don't connect if already connected
    if (socketRef.current?.connected) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    // Get JWT token
    const token = getAuthToken();
    if (!token) {
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection with authentication
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      auth: {
        token: token,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socketRef.current = socket;
  };

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  /**
   * Check authentication and connect/disconnect accordingly
   */
  useEffect(() => {
    let wasAuthenticated = isAuthenticated();

    // Check authentication status on mount
    const checkAuthAndConnect = () => {
      const currentlyAuthenticated = isAuthenticated();
      
      // Only reconnect/disconnect if auth state changed
      if (currentlyAuthenticated && !wasAuthenticated) {
        // User just logged in
        connect();
        wasAuthenticated = true;
      } else if (!currentlyAuthenticated && wasAuthenticated) {
        // User just logged out
        disconnect();
        wasAuthenticated = false;
      } else if (currentlyAuthenticated && !socketRef.current?.connected) {
        // User is authenticated but socket not connected (e.g., page refresh)
        connect();
      }
    };

    // Initial check
    checkAuthAndConnect();

    // Listen for storage changes (token added/removed in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token') {
        checkAuthAndConnect();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for custom logout event (for same-tab logout)
    const handleLogout = () => {
      disconnect();
      wasAuthenticated = false;
    };

    window.addEventListener('auth:logout', handleLogout);

    // Check periodically (in case token is removed in same window)
    // This handles cases where localStorage is modified directly
    const interval = setInterval(() => {
      checkAuthAndConnect();
    }, 2000);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleLogout);
      clearInterval(interval);
      disconnect();
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    socket: socketRef.current,
    isConnected,
  }), [isConnected]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook to use Socket context
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
