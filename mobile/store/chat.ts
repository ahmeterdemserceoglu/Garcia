import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from './auth'

interface Message {
  id: string
  matchId?: string
  senderId: string
  content?: string
  type: string
  isRead: boolean
  createdAt: string
  sender?: { profile?: { name: string } }
}

interface ChatState {
  socket: Socket | null
  activeMatchId: string | null
  typingUsers: Set<string>
  onReadCallback: ((matchId: string) => void) | null
  connectSocket: () => void
  disconnectSocket: () => void
  setActiveMatch: (matchId: string | null) => void
  setOnReadCallback: (cb: ((matchId: string) => void) | null) => void
  startTyping: (matchId: string) => void
  stopTyping: (matchId: string) => void
  pingInterval: ReturnType<typeof setInterval> | null
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  activeMatchId: null,
  typingUsers: new Set(),
  onReadCallback: null,
  pingInterval: null,

  setOnReadCallback: (cb) => set({ onReadCallback: cb }),

  connectSocket: () => {
    const user = useAuthStore.getState().user
    if (!user) return

    if (get().socket) return // Already connected

    // Use Cloudflare tunnel URL (HTTPS/WSS compatible)
    const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'https://garcia.maxen.sbs'
    const socket = io(WS_URL, {
      auth: { userId: user.id },
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      const existingInterval = get().pingInterval
      if (existingInterval) clearInterval(existingInterval)
      
      const interval = setInterval(() => {
        socket.emit('ping')
      }, 30000)
      set({ pingInterval: interval })
    })

    socket.on('disconnect', () => {
      const { pingInterval } = get()
      if (pingInterval) clearInterval(pingInterval)
      set({ pingInterval: null })
    })

    socket.on('typing:start', ({ userId }) => {
      const typingUsers = new Set(get().typingUsers)
      typingUsers.add(userId)
      set({ typingUsers })
    })

    socket.on('typing:stop', ({ userId }) => {
      const typingUsers = new Set(get().typingUsers)
      typingUsers.delete(userId)
      set({ typingUsers })
    })

    socket.on('message:new', (message: Message) => {
      if (!message || !message.matchId) return

      const { useMatchesStore } = require('./matches')
      const matchesStore = useMatchesStore.getState()
      const matches = matchesStore.matches
      
      const matchIndex = matches.findIndex((m: any) => m.id === message.matchId)
      if (matchIndex >= 0) {
        const updatedMatches = [...matches]
        const match = { ...updatedMatches[matchIndex] }
        match.messages = [message]
        match.updatedAt = message.createdAt
        
        // Mark as read if chat is open, else leave as unread
        if (get().activeMatchId === message.matchId) {
          match.messages[0].isRead = true
          socket.emit('message:read', { matchId: message.matchId })
        }

        updatedMatches.splice(matchIndex, 1)
        updatedMatches.unshift(match)
        matchesStore.setMatches(updatedMatches)
      }
    })

    socket.on('messages:read', ({ matchId }: { matchId: string }) => {
      // Notify the active chat screen so ticks turn blue instantly
      const callback = get().onReadCallback
      if (callback) callback(matchId)

      // Also update the matches list preview
      const { useMatchesStore } = require('./matches')
      const matchesStore = useMatchesStore.getState()
      const matches = matchesStore.matches
      
      const matchIndex = matches.findIndex((m: any) => m.id === matchId)
      if (matchIndex >= 0) {
        const updatedMatches = [...matches]
        const match = { ...updatedMatches[matchIndex] }
        if (match.messages && match.messages[0]) {
          match.messages[0].isRead = true
        }
        updatedMatches[matchIndex] = match
        matchesStore.setMatches(updatedMatches)
      }
    })

    set({ socket })
  },

  disconnectSocket: () => {
    const { socket, pingInterval } = get()
    if (pingInterval) clearInterval(pingInterval)
    if (socket) {
      socket.disconnect()
      set({ socket: null, typingUsers: new Set(), activeMatchId: null, pingInterval: null })
    }
  },

  setActiveMatch: (matchId: string | null) => {
    const socket = get().socket
    if (socket && matchId) {
      socket.emit('join:match', matchId)
    }
    set({ activeMatchId: matchId })
  },

  startTyping: (matchId: string) => {
    const socket = get().socket
    if (socket) {
      socket.emit('typing:start', { matchId })
    }
  },

  stopTyping: (matchId: string) => {
    const socket = get().socket
    if (socket) {
      socket.emit('typing:stop', { matchId })
    }
  },
}))
