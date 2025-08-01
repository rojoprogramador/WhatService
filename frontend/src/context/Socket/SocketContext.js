import { createContext } from "react";
import openSocket from "socket.io-client";
import { isExpired, decodeToken } from "react-jwt";

class ManagedSocket {
  constructor(socketManager) {
    this.socketManager = socketManager;
    this.rawSocket = socketManager.currentSocket;
    this.callbacks = [];
    this.joins = [];

    this.rawSocket.on("connect", () => {
      if (this.rawSocket.io.opts.query?.r && !this.rawSocket.recovered) {
        const refreshJoinsOnReady = () => {
          for (const j of this.joins) {
            console.debug("refreshing join", j);
            this.rawSocket.emit(`join${j.event}`, ...j.params);
          }
          this.rawSocket.off("ready", refreshJoinsOnReady);
        };
        for (const j of this.callbacks) {
          this.rawSocket.off(j.event, j.callback);
          this.rawSocket.on(j.event, j.callback);
        }
        
        this.rawSocket.on("ready", refreshJoinsOnReady);
      }
    });
  }
  
  on(event, callback) {
    if (event === "ready" || event === "connect") {
      return this.socketManager.onReady(callback);
    }
    this.callbacks.push({event, callback});
    return this.rawSocket.on(event, callback);
  }
  
  off(event, callback) {
    const i = this.callbacks.findIndex((c) => c.event === event && c.callback === callback);
    this.callbacks.splice(i, 1);
    return this.rawSocket.off(event, callback);
  }
  
  emit(event, ...params) {
    if (event.startsWith("join")) {
      this.joins.push({ event: event.substring(4), params });
      console.log("Joining", { event: event.substring(4), params});
    }
    return this.rawSocket.emit(event, ...params);
  }
  
  disconnect() {
    for (const j of this.joins) {
      this.rawSocket.emit(`leave${j.event}`, ...j.params);
    }
    this.joins = [];
    for (const c of this.callbacks) {
      this.rawSocket.off(c.event, c.callback);
    }
    this.callbacks = [];
  }
}

class DummySocket {
  on(..._) {}
  off(..._) {}
  emit(..._) {}
  disconnect() {}
}

const SocketManager = {
  currentCompanyId: -1,
  currentUserId: -1,
  currentSocket: null,
  socketReady: false,

  getSocket: function(companyId) {
    console.log('🔌 SocketManager.getSocket called with companyId:', companyId);
    
    let userId = null;
    if (localStorage.getItem("userId")) {
      userId = localStorage.getItem("userId");
    }

    console.log('🔌 Socket check - userId:', userId, 'companyId:', companyId, 'currentSocket exists:', !!this.currentSocket);

    if (!companyId && !this.currentSocket) {
      console.log('❌ No companyId and no currentSocket - returning DummySocket');
      return new DummySocket();
    }

    if (companyId && typeof companyId !== "string") {
      companyId = `${companyId}`;
    }

    if (companyId !== this.currentCompanyId || userId !== this.currentUserId) {
      if (this.currentSocket) {
        console.log("🔌 Closing old socket - company or user changed");
        this.currentSocket.removeAllListeners();
        this.currentSocket.disconnect();
        this.currentSocket = null;
        this.currentCompanyId = null;
		    this.currentUserId = null;
      }

      let token = JSON.parse(localStorage.getItem("token"));
      console.log('🔑 Token check - exists:', !!token, 'expired:', token ? isExpired(token) : 'no token');
      
      if (!token) {
        console.log('❌ No token - returning DummySocket');
        return new DummySocket();
      }
      
      if ( isExpired(token) ) {
        console.warn("❌ Expired token, reload after refresh");
        setTimeout(() => {
          window.location.reload();
        },1000);
        return new DummySocket();
      }

      this.currentCompanyId = companyId;
      this.currentUserId = userId;
      
      console.log('🔌 Creating new socket connection to:', process.env.REACT_APP_BACKEND_URL);
      
      this.currentSocket = openSocket(process.env.REACT_APP_BACKEND_URL, {
        transports: ["websocket"],
        pingTimeout: 18000,
        pingInterval: 18000,
        query: { token },
        forceNew: true,
        reconnection: true,
        timeout: 5000,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.currentSocket.io.on("reconnect_attempt", () => {
        this.currentSocket.io.opts.query.r = 1;
        token = JSON.parse(localStorage.getItem("token"));
        if ( isExpired(token) ) {
          console.warn("Refreshing");
          window.location.reload();
        } else {
          console.warn("Using new token");
          this.currentSocket.io.opts.query.token = token;
        }
      });
      
      this.currentSocket.on("connect", () => {
        console.log('✅ Socket connected successfully to backend!');
        console.log('✅ Socket ID:', this.currentSocket.id);
        window.socketManager = this; // Make socket manager available globally for debugging
      });

      this.currentSocket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
      });

      this.currentSocket.on("disconnect", (reason) => {
        console.warn(`🔌 Socket disconnected because: ${reason}`);
        if (reason.startsWith("io server disconnect")) {
          console.warn("🔌 Trying to reconnect", this.currentSocket);
          token = JSON.parse(localStorage.getItem("token"));
          
          if ( isExpired(token) ) {
            console.warn("❌ Expired token - refreshing");
            window.location.reload();
            return;
          }
          console.warn("🔌 Reconnecting using refreshed token");
          this.currentSocket.io.opts.query.token = token;
          this.currentSocket.io.opts.query.r = 1;
          this.currentSocket.connect();
        }        
      });
      
      this.currentSocket.on("connect", (...params) => {
        console.warn("socket connected", params);
      })
      
      this.currentSocket.onAny((event, ...args) => {
        console.debug("Event: ", { socket: this.currentSocket, event, args });
      });
      
      this.onReady(() => {
        this.socketReady = true;
      });

    }
    
    console.log('🔌 Returning ManagedSocket wrapper');
    return new ManagedSocket(this);
  },
  
  onReady: function( callbackReady ) {
    if (this.socketReady) {
      callbackReady();
      return
    }
    
    this.currentSocket.once("ready", () => {
      callbackReady();
    });
  },
  
  onConnect: function( callbackReady ) { this.onReady( callbackReady ) },

};

const SocketContext = createContext()

// Make SocketManager available globally for debugging
if (typeof window !== 'undefined') {
  window.SocketManager = SocketManager;
}

export { SocketContext, SocketManager };
