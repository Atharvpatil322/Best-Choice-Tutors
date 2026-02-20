/**
 * Socket Context
 * Foundation for WebSocket connection management (infrastructure only)
 * 
 * Features:
 * - Manages a single WebSocket connection
 * - Connects only when user is authenticated AND backend socket server is available
 * - Disconnects on logout
 * - No auto-connect or repeated reconnect attempts
 * - Uses JWT from localStorage to authenticate socket
 * 
 * Note: Backend socket server not yet implemented - connection attempts are disabled
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

/**
 * Check if backend socket server is available
 * Socket server is implemented for booking-scoped chat.
 */
const isSocketServerAvailable = () => {
  return true;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  /**
   * Connect to WebSocket server
   * Only connects if backend socket server is available
   */
  const connect = () => {
    // Don't connect if already connected
    if (socketRef.current?.connected) {
      return;
    }

    // Check if backend socket server is available
    if (!isSocketServerAvailable()) {
      // Backend socket server not available - don't attempt connection
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
    // autoConnect: false - manual connection only
    // reconnection: false - no repeated reconnect attempts
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      auth: {
        token: token,
      },
      autoConnect: false,
      reconnection: true, // Reconnect so tutor can receive notifications after network blips
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
      // Don't attempt reconnection - backend server may not be available
    });

    socketRef.current = socket;
    
    // Manually connect (since autoConnect is false)
    socket.connect();
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
   * Handle authentication changes and socket connection/disconnection
   * Only connects if backend socket server is available
   */
  useEffect(() => {
    let wasAuthenticated = isAuthenticated();

    // Check authentication status on mount
    const checkAuthAndConnect = () => {
      const currentlyAuthenticated = isAuthenticated();
      
      // Only reconnect/disconnect if auth state changed
      if (currentlyAuthenticated && !wasAuthenticated) {
        // User just logged in - only connect if server is available
        if (isSocketServerAvailable()) {
          connect();
        }
        wasAuthenticated = true;
      } else if (!currentlyAuthenticated && wasAuthenticated) {
        // User just logged out
        disconnect();
        wasAuthenticated = false;
      } else if (currentlyAuthenticated && !socketRef.current?.connected) {
        // User is authenticated but socket not connected (e.g., page refresh)
        // Only connect if server is available
        if (isSocketServerAvailable()) {
          connect();
        }
      }
    };

    // Initial check (will not connect if server unavailable)
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

    // Cleanup on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleLogout);
      disconnect();
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
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
