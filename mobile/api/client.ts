import axios, { AxiosInstance, AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (() => { throw new Error('EXPO_PUBLIC_API_URL is not set') })()

class ApiClient {
  private client: AxiosInstance
  private refreshing = false
  private refreshSubscribers: ((token: string) => void)[] = []

  private onRefreshed(token: string) {
    this.refreshSubscribers.map((cb) => cb(token))
    this.refreshSubscribers = []
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb)
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('accessToken')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    this.client.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        const original = error.config as any
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true
          
          if (this.refreshing) {
            return new Promise((resolve) => {
              this.addRefreshSubscriber((token: string) => {
                original.headers.Authorization = `Bearer ${token}`
                resolve(this.client(original))
              })
            })
          }
          
          this.refreshing = true
          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken')
            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
            await AsyncStorage.multiSet([
              ['accessToken', data.accessToken],
              ['refreshToken', data.refreshToken],
            ])
            this.refreshing = false
            this.onRefreshed(data.accessToken)
            original.headers.Authorization = `Bearer ${data.accessToken}`
            return this.client(original)
          } catch (err) {
            this.refreshing = false
            const { useAuthStore } = require('../store/auth')
            useAuthStore.getState().logout()
            return Promise.reject(err)
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth
  async checkEmail(email: string) {
    return this.client.post('/auth/check-email', { email })
  }
  async register(payload: { email: string; password: string; name: string; birthDate: string; gender: string }) {
    return this.client.post('/auth/register', payload)
  }
  async login(payload: { email: string; password: string; deviceId?: string; deviceName?: string }) {
    return this.client.post('/auth/login', payload)
  }
  async refresh(refreshToken: string) {
    return this.client.post('/auth/refresh', { refreshToken })
  }
  async me() {
    return this.client.get('/auth/me')
  }
  async deleteAccount() {
    return this.client.delete('/auth/account')
  }

  // Profile
  async getProfile(userId: string) {
    return this.client.get(`/profile/${userId}`)
  }
  async updateProfile(data: Record<string, any>) {
    return this.client.patch('/profile', data)
  }
  async upgradePremium() {
    return this.client.post('/profile/upgrade')
  }

  // Discover
  async getDiscover() {
    return this.client.get('/discover')
  }
  async getLikesSent() {
    return this.client.get('/discover/likes-sent')
  }
  async getWhoLikedMe() {
    return this.client.get('/discover/who-liked-me')
  }
  async searchUsers(query: string) {
    return this.client.get('/discover/search', { params: { q: query } })
  }
  async getStories() {
    return this.client.get('/stories')
  }
  async likeUser(targetUserId: string, isSuperLike = false, note?: string) {
    return this.client.post('/discover/like', { targetUserId, isSuperLike, note })
  }

  async passUser(targetUserId: string) {
    return this.client.post('/discover/pass', { targetUserId })
  }
  async startBlindDate() {
    return this.client.post('/discover/blind-date')
  }
  async startFastExpress() {
    return this.client.post('/discover/fast-express')
  }
  async boostProfile() {
    return this.client.post('/discover/boost')
  }

  // Matches
  async getMatches() {
    return this.client.get('/matches')
  }
  async getMessages(matchId: string, cursor?: string) {
    return this.client.get(`/matches/${matchId}/messages`, { params: { cursor } })
  }
  async sendMessage(matchId: string, type: string, content?: string, mediaUrl?: string) {
    return this.client.post(`/matches/${matchId}/messages`, { type, content, mediaUrl })
  }
  async deleteMessage(matchId: string, messageId: string) {
    return this.client.delete(`/matches/${matchId}/messages/${messageId}`)
  }
  async clearChat(matchId: string) {
    return this.client.post(`/matches/${matchId}/clear`)
  }

  // Location
  async updateLocation(latitude: number, longitude: number, accuracy?: number, status?: string) {
    return this.client.post('/location', { latitude, longitude, accuracy, status })
  }
  async getNearby(radius = 10) {
    return this.client.get('/location/nearby', { params: { radius } })
  }

  // Notifications
  async getNotifications() {
    return this.client.get('/notifications')
  }
  async markNotificationsRead() {
    return this.client.post('/notifications/read')
  }
  async registerPushToken(token: string, platform: string) {
    return this.client.post('/notifications/register-token', { token, platform })
  }
  async unregisterPushToken(token: string) {
    return this.client.delete('/notifications/register-token', { data: { token } })
  }

  // Events
  async getEvents(city?: string) {
    return this.client.get('/events', { params: { city } })
  }
  async createEvent(data: Record<string, any>) {
    return this.client.post('/events', data)
  }
  async attendEvent(eventId: string, status: string) {
    return this.client.post(`/events/${eventId}/attend`, { status })
  }

  // Moderation
  async reportUser(reportedUserId: string, reason: string, description?: string, images?: string[]) {
    return this.client.post('/report', { reportedUserId, reason, description, images })
  }

  // Profile Visitors
  async getProfileVisitors() {
    return this.client.get('/profile/visitors')
  }

  // Daily Check-in
  async dailyCheckin() {
    return this.client.post('/profile/checkin')
  }
}

export const api = new ApiClient()
