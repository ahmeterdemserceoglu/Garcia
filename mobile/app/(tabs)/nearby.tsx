import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  AppState,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../../api/client'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { ApprovalGuard } from '../../components/ApprovalGuard'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Map, Camera, Marker, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native'
import { ProfileDetailSheet } from '../../components/ProfileDetailSheet'
import { useAuthStore } from '../../store/auth'

// Durum ön ayarları (Ionicons ikon adları ve renkleriyle)
const STATUS_PRESETS = [
  { id: 'coffee', label: 'Kahve Zamanı', icon: 'cafe-outline' as const, color: '#C68B59' },
  { id: 'drink', label: 'Takılıyorum', icon: 'beer-outline' as const, color: '#F59E0B' },
  { id: 'music', label: 'Müzik Dinliyorum', icon: 'musical-notes-outline' as const, color: '#8B5CF6' },
  { id: 'gym', label: 'Spordayım', icon: 'barbell-outline' as const, color: '#10B981' },
  { id: 'food', label: 'Yemekteyim', icon: 'fast-food-outline' as const, color: '#F97316' },
  { id: 'work', label: 'Çalışıyorum', icon: 'laptop-outline' as const, color: '#3B82F6' },
  { id: 'party', label: 'Eğleniyorum', icon: 'sparkles-outline' as const, color: '#EC4899' },
  { id: 'chat', label: 'Sohbete Açık', icon: 'chatbubble-ellipses-outline' as const, color: '#14B8A6' },
]

function getWeatherEmoji(code?: number) {
  if (code === undefined) return '☀️'
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  if (code <= 99) return '⛈️'
  return '🌡️'
}

function createGeoJSONCircle(center: [number, number], radiusInKm: number, points = 64) {
  const coords = { latitude: center[1], longitude: center[0] }
  const km = radiusInKm
  const ret = []
  const distanceX = km / (111.320 * Math.cos((coords.latitude * Math.PI) / 180))
  const distanceY = km / 110.574
  let theta, x, y
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI)
    x = distanceX * Math.cos(theta)
    y = distanceY * Math.sin(theta)
    ret.push([coords.longitude + x, coords.latitude + y])
  }
  ret.push(ret[0])
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [ret] },
        properties: {},
      },
    ],
  }
}

const { width, height } = Dimensions.get('window')

function getDistanceRaw(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dist = getDistanceRaw(lat1, lon1, lat2, lon2)
  return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`
}

export default function NearbyScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const currentUser = useAuthStore((state) => state.user)

  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [likedUserIds, setLikedUserIds] = useState<Set<string>>(new Set())
  const [whoLikedMeIds, setWhoLikedMeIds] = useState<Set<string>>(new Set())
  const [isLocating, setIsLocating] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(12)
  const [mapTheme, setMapTheme] = useState<'dark' | 'light' | 'voyager'>('dark')

  // Phase 3 States
  const [weather, setWeather] = useState<{ temp: number; code: number; city?: string } | null>(null)
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false)
  const [myStatus, setMyStatus] = useState<string | null>(null)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [locationWarningVisible, setLocationWarningVisible] = useState(false)

  // Local Filters
  const [filterDistance, setFilterDistance] = useState<number>(50)
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all')

  const cameraRef = useRef<any>(null)
  const locationRef = useRef(location)
  const prevCountRef = useRef(0)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  // Load Saved Preferences
  useEffect(() => {
    ;(async () => {
      try {
        const savedGhost = await AsyncStorage.getItem('garcia_ghost_mode')
        if (savedGhost) setIsGhostMode(savedGhost === 'true')
        const savedStatus = await AsyncStorage.getItem('garcia_my_status')
        if (savedStatus) setMyStatus(savedStatus)
      } catch (e) {}
    })()
  }, [])

  // Fetch Live Weather
  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const [weatherRes, geoRes] = await Promise.allSettled([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`).then((r) => r.json()),
        Location.reverseGeocodeAsync({ latitude: lat, longitude: lon }),
      ])

      let cityName = ''
      if (geoRes.status === 'fulfilled' && geoRes.value?.[0]) {
        const g = geoRes.value[0]
        cityName = g.district || g.subregion || g.city || ''
      }

      if (weatherRes.status === 'fulfilled' && weatherRes.value?.current_weather) {
        setWeather({
          temp: Math.round(weatherRes.value.current_weather.temperature),
          code: weatherRes.value.current_weather.weathercode,
          city: cityName,
        })
      }
    } catch (e) {
      console.log('Weather fetch failed', e)
    }
  }

  // Fetch Who Liked Me
  const fetchWhoLikedMe = async () => {
    try {
      const [whoRes, sentRes] = await Promise.all([
        api.getWhoLikedMe().catch(() => null),
        api.getLikesSent().catch(() => null)
      ])
      
      if (whoRes?.data) {
        const data = whoRes.data
        const list = data?.likes || data?.users || data || []
        const ids = new Set<string>(
          list.map((item: any) => item.userId || item.id || item.user?.id).filter(Boolean),
        )
        setWhoLikedMeIds(ids)
      }
      
      if (sentRes?.data?.likedUserIds) {
        setLikedUserIds(new Set(sentRes.data.likedUserIds))
      }
    } catch (e) {}
  }

  const fetchNearby = async (loc: Location.LocationObject, silent = false) => {
    if (!silent) setIsLocating(true)
    try {
      let lat = loc.coords.latitude
      let lng = loc.coords.longitude
      if (isGhostMode) {
         lat += (Math.random() - 0.5) * 0.01
         lng += (Math.random() - 0.5) * 0.01
      }
      await api.updateLocation(
        lat,
        lng,
        loc.coords.accuracy || undefined,
        myStatus || undefined,
      )
      const { data } = await api.getNearby(50)
      const users = data.nearbyUsers || []
      setNearbyUsers(users)

      if (users.length > prevCountRef.current && prevCountRef.current > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      }
      prevCountRef.current = users.length
    } catch (err) {
      console.log('Error fetching nearby:', err)
    } finally {
      if (!silent) setIsLocating(false)
    }
  }

  // 30s Auto Refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (locationRef.current) {
        fetchNearby(locationRef.current, true)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Resilient location loader
  const initLocation = async (isRetry = false) => {
    try {
      if (isRetry) setErrorMsg(null)

      const { status: existingStatus } = await Location.getForegroundPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync()
        finalStatus = req.status
      }

      if (finalStatus !== 'granted') {
        if (!locationRef.current) {
          setErrorMsg('Lokasyon izni reddedildi.')
        }
        return
      }

      setErrorMsg(null)

      const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null)
      if (lastKnown) {
        setLocation(lastKnown)
        fetchNearby(lastKnown, true)
        fetchWeather(lastKnown.coords.latitude, lastKnown.coords.longitude)
        fetchWhoLikedMe()
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(async () => {
        return await Location.getLastKnownPositionAsync().catch(() => null)
      })

      if (loc) {
        setLocation(loc)
        await Promise.allSettled([
          fetchNearby(loc, true),
          fetchWeather(loc.coords.latitude, loc.coords.longitude),
          fetchWhoLikedMe(),
        ])
      } else if (!locationRef.current && !lastKnown) {
        setErrorMsg('Konum servisi (GPS) yanıt vermedi. Lütfen tekrar deneyin.')
      }
    } catch (err) {
      console.log('Error initializing location:', err)
      if (!locationRef.current) {
        setErrorMsg(
          'Cihazının konum servisi (GPS) kapalı olabilir. Lütfen ayarlardan aç ve tekrar dene.',
        )
      }
    }
  }

  // Initial Location & Continuous Watch
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null
    initLocation()

    ;(async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync()
        if (status === 'granted') {
          locationSubscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 100 },
            (newLoc) => {
              setLocation(newLoc)
            },
          )
        }
      } catch (e) {}
    })()

    return () => {
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [])

  // Handle AppState (Foreground / Background resume)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        if (locationRef.current) {
          fetchNearby(locationRef.current, true)
          fetchWeather(locationRef.current.coords.latitude, locationRef.current.coords.longitude)
          fetchWhoLikedMe()
        } else {
          initLocation(false)
        }
      }
    })
    return () => sub.remove()
  }, [])

  const handleLocateMe = async () => {
    if (!cameraRef.current || !location) return
    try {
      cameraRef.current.flyTo({
        center: [location.coords.longitude, location.coords.latitude],
        zoom: 14,
        animationDuration: 500,
      })
    } catch (err) {
      console.log('Error focusing location', err)
    }
  }

  const toggleGhostMode = async () => {
    const next = !isGhostMode
    setIsGhostMode(next)
    await AsyncStorage.setItem('garcia_ghost_mode', String(next))
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    
    // Push new location immediately
    if (locationRef.current) {
      let lat = locationRef.current.coords.latitude
      let lng = locationRef.current.coords.longitude
      if (next) {
         lat += (Math.random() - 0.5) * 0.01
         lng += (Math.random() - 0.5) * 0.01
      }
      api.updateLocation(lat, lng, locationRef.current.coords.accuracy || undefined, myStatus || undefined).catch(() => {})
    }
  }

  const selectStatus = async (preset: typeof STATUS_PRESETS[0] | null) => {
    const statusText = preset ? preset.label : null
    setMyStatus(statusText)
    try {
      if (statusText) {
        await AsyncStorage.setItem('garcia_my_status', statusText)
      } else {
        await AsyncStorage.removeItem('garcia_my_status')
      }

      await api.updateProfile({ status: statusText || '' }).catch(() => {})
      if (locationRef.current) {
        await api
          .updateLocation(
            locationRef.current.coords.latitude,
            locationRef.current.coords.longitude,
            locationRef.current.coords.accuracy || undefined,
            statusText || '',
          )
          .catch(() => {})
      }
    } catch (e) {
      console.log('Error saving status', e)
    }
    setStatusModalVisible(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  }

  const mapStyleUrl =
    mapTheme === 'dark'
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : mapTheme === 'light'
      ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      : JSON.stringify({
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256
            }
          },
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }]
        })

  const filteredUsers = nearbyUsers.filter((loc) => {
    if (!location) return false
    const dist = getDistanceRaw(
      location.coords.latitude,
      location.coords.longitude,
      loc.latitude,
      loc.longitude,
    )
    if (dist > filterDistance) return false
    if (filterGender !== 'all' && loc.user?.gender !== filterGender) return false
    return true
  })

  if (errorMsg && !location) {
    return (
      <ApprovalGuard>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrapper}>
            <Ionicons name="location-outline" size={64} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Konum Bulunamadı</Text>
          <Text style={styles.errorText}>
            Çevrendeki insanları görebilmek için konum erişimine izin vermelisin.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => initLocation(true)} activeOpacity={0.8}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.retryGrad}>
              <Text style={styles.retryText}>Tekrar Dene / İzin Ver</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ApprovalGuard>
    )
  }

  return (
    <ApprovalGuard>
      <View style={styles.container}>
        <Map
          style={styles.map}
          mapStyle={mapStyleUrl}
          logo={false}
          attribution={false}
        >
          {(() => {
            const myRenderLng = location ? (isGhostMode ? location.coords.longitude + Math.sin((currentUser?.id || 'x').charCodeAt(0)) * 0.0035 : location.coords.longitude) : 0
            const myRenderLat = location ? (isGhostMode ? location.coords.latitude + Math.cos((currentUser?.id || 'x').charCodeAt(0)) * 0.0035 : location.coords.latitude) : 0
            
            return (
              <>
          {location && (
            <Camera
              ref={cameraRef}
              zoom={zoomLevel}
              center={[myRenderLng, myRenderLat]}
              easing="fly"
              duration={1000}
            />
          )}

          {location && currentUser?.profile?.showLocation !== false && (
            <Marker
              id="my-own-profile-marker"
              lngLat={[myRenderLng, myRenderLat]}
              onPress={() => setStatusModalVisible(true)}
              style={{ zIndex: 200 }}
            >
              <View style={{ alignItems: 'center' }}>
                {myStatus ? (
                  <TouchableOpacity
                    style={styles.myStatusPill}
                    onPress={() => setStatusModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={
                        STATUS_PRESETS.find((p) => p.label === myStatus)?.icon ||
                        'chatbubble-outline'
                      }
                      size={12}
                      color="#fff"
                      style={{ marginRight: 3 }}
                    />
                    <Text style={styles.myStatusPillText}>{myStatus}</Text>
                    <View style={styles.myStatusArrow} />
                  </TouchableOpacity>
                ) : null}

                <View style={styles.myMarkerContainer}>
                  {currentUser?.photos?.[0]?.url ? (
                    <Image
                      source={{ uri: currentUser.photos[0].url }}
                      style={styles.myMarkerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.myMarkerImage, styles.myMarkerPlaceholder]}>
                      <Text style={{ fontSize: 18 }}>👤</Text>
                    </View>
                  )}
                  <View style={styles.myOnlineIndicator} />
                </View>

                <View style={styles.myLabelBadge}>
                  <Text style={styles.myLabelText}>Sen</Text>
                </View>
              </View>
            </Marker>
          )}

          {location && (
            <GeoJSONSource
              id="radar-source"
              data={createGeoJSONCircle(
                [myRenderLng, myRenderLat],
                filterDistance,
              )}
            >
              <Layer
                id="radar-fill"
                type="fill"
                paint={{
                  'fill-color': Colors.primary,
                  'fill-opacity': mapTheme === 'dark' ? 0.08 : 0.15,
                }}
              />
              <Layer
                id="radar-line"
                type="line"
                paint={{
                  'line-color': Colors.primary,
                  'line-width': 2,
                  'line-dasharray': [3, 3],
                  'line-opacity': 0.8,
                }}
              />
            </GeoJSONSource>
          )}

          {filteredUsers.map((loc) => {
            const user = loc.user
            if (!user) return null
            const dist = location
              ? getDistance(
                  location.coords.latitude,
                  location.coords.longitude,
                  loc.latitude,
                  loc.longitude,
                )
              : ''
            const isSelected = selectedUser?.id === user.id
            const isLikedMe = whoLikedMeIds.has(user.id)

            const displayLng = loc.longitude
            const displayLat = loc.latitude

            return (
              <Marker
                key={loc.id}
                id={user.id}
                lngLat={[displayLng, displayLat]}
                onPress={() => setSelectedUser(user)}
                style={{ zIndex: isSelected ? 100 : isLikedMe ? 50 : 1 }}
              >
                <View style={{ alignItems: 'center' }}>
                  {(loc.status || user.profile?.status || (user as any).status) ? (
                    <View style={styles.otherStatusPill}>
                      {(() => {
                        const statusText = loc.status || user.profile?.status || (user as any).status
                        const preset = STATUS_PRESETS.find((p) => p.label === statusText)
                        return preset ? (
                          <Ionicons
                            name={preset.icon}
                            size={12}
                            color="#fff"
                            style={{ marginRight: 3 }}
                          />
                        ) : null
                      })()}
                      <Text style={styles.otherStatusPillText}>
                        {loc.status || user.profile?.status || (user as any).status}
                      </Text>
                      <View style={styles.otherStatusArrow} />
                    </View>
                  ) : null}

                  {isLikedMe && (
                    <View style={styles.likedMeBadge}>
                      <Text style={styles.likedMeBadgeText}>💖 Seni Beğendi</Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.markerContainer,
                      isLikedMe && styles.markerLikedMe,
                      isSelected && {
                        transform: [{ scale: 1.3 }],
                        borderWidth: 2,
                        borderColor: '#fff',
                      },
                    ]}
                  >
                    {user.photos?.[0]?.url ? (
                      <Image
                        source={{ uri: user.photos[0].url }}
                        style={styles.markerImage as any}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.markerImage, styles.markerPlaceholder]}>
                        <Text style={{ fontSize: 16 }}>👤</Text>
                      </View>
                    )}
                    <View style={styles.onlineIndicator} />
                  </View>

                  {dist ? (
                    <View
                      style={[
                        styles.distanceBadge,
                        mapTheme !== 'dark' && { backgroundColor: Colors.primary },
                      ]}
                    >
                      <Text style={styles.distanceText}>{dist}</Text>
                    </View>
                  ) : null}
                </View>
              </Marker>
            )
          })}
              </>
            )
          })()}
        </Map>

        {/* Floating Controls Right */}
        <View style={styles.rightControls}>
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomLevel((z) => Math.min(z + 1, 20))}
            >
              <Ionicons name="add" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.zoomDivider} />
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomLevel((z) => Math.max(z - 1, 1))}
            >
              <Ionicons name="remove" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.mapControlBtn, isGhostMode && styles.mapControlBtnActive, currentUser?.profile?.showLocation === false && { opacity: 0.5 }]}
            onPress={() => {
              if (currentUser?.profile?.showLocation === false) {
                setLocationWarningVisible(true)
                return
              }
              toggleGhostMode()
            }}
          >
            <Ionicons
              name={isGhostMode ? 'eye-off' : 'eye-outline'}
              size={22}
              color={isGhostMode ? '#fff' : Colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mapControlBtn, currentUser?.profile?.showLocation === false && { opacity: 0.5 }]} 
            onPress={() => {
              if (currentUser?.profile?.showLocation === false) {
                setLocationWarningVisible(true)
                return
              }
              setStatusModalVisible(true)
            }}
          >
            {myStatus ? (
              <Ionicons
                name={
                  STATUS_PRESETS.find((p) => p.label === myStatus)?.icon ||
                  'chatbubble-outline'
                }
                size={22}
                color={
                  STATUS_PRESETS.find((p) => p.label === myStatus)?.color ||
                  Colors.textPrimary
                }
              />
            ) : (
              <Ionicons name="chatbubble-outline" size={22} color={Colors.textPrimary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={() =>
              setMapTheme((t) =>
                t === 'dark' ? 'light' : t === 'light' ? 'voyager' : 'dark',
              )
            }
          >
            <Ionicons name="layers-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Floating Minimalist Header */}
        <LinearGradient
          colors={
            mapTheme === 'dark'
              ? ['rgba(15,13,18,0.85)', 'rgba(15,13,18,0)']
              : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']
          }
          style={[styles.floatingHeader, { paddingTop: insets.top + Spacing.sm }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.countBadge}>
                <View style={styles.livePulseDot} />
                <Text style={styles.countBadgeText}>{filteredUsers.length} kişi</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {weather && (
                <View style={styles.weatherBadge}>
                  <Text style={styles.weatherIcon}>{getWeatherEmoji(weather.code)}</Text>
                  <Text style={styles.weatherText}>
                    {weather.temp}°C{weather.city ? ` · ${weather.city}` : ''}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.filterTriggerBtn,
                  (filterDistance !== 50 || filterGender !== 'all') && styles.filterTriggerBtnActive,
                ]}
                onPress={() => {
                  setFilterModalVisible(true)
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="options-outline"
                  size={18}
                  color={
                    filterDistance !== 50 || filterGender !== 'all'
                      ? '#fff'
                      : Colors.textPrimary
                  }
                />
                {(filterDistance !== 50 || filterGender !== 'all') && (
                  <View style={styles.activeFilterDot} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {isGhostMode && (
            <View style={styles.ghostAlertBanner}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.ghostAlertText}>
                Hayalet Modu: Tam konumunuz gizleniyor (Yaklaşık mod)
              </Text>
            </View>
          )}

          {currentUser?.profile?.showLocation === false && (
            <View style={styles.hiddenLocationBanner}>
              <Ionicons name="eye-off" size={14} color="#FF6B6B" />
              <Text style={styles.hiddenLocationText}>
                Konumunuz Gizli: Profiliniz haritada ve radarda görünmüyor.
              </Text>
            </View>
          )}
        </LinearGradient>

        {isLocating && (
          <View style={styles.locatingOverlay}>
            <View style={styles.locatingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.locatingText}>Etraf taranıyor...</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.fab, { bottom: Spacing.xl }]}
          activeOpacity={0.9}
          onPress={handleLocateMe}
        >
          <LinearGradient colors={[Colors.surface, Colors.surface]} style={styles.fabInner}>
            <Ionicons name="locate" size={28} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Status Selection Modal */}
        <Modal
          visible={statusModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setStatusModalVisible(false)}
          >
            <View style={styles.statusModalCard}>
              <Text style={styles.statusModalTitle}>Haritada Ne Yapıyorsun?</Text>
              <Text style={styles.statusModalSub}>
                İsteğe bağlı bir durum seçebilir veya kaldırabilirsin.
              </Text>

              <View style={styles.statusGrid}>
                {STATUS_PRESETS.map((preset) => {
                  const isSelected = myStatus === preset.label
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.statusOption, isSelected && styles.statusOptionActive]}
                      onPress={() => selectStatus(preset)}
                    >
                      <Ionicons name={preset.icon} size={24} color={preset.color} />
                      <Text
                        style={[
                          styles.statusOptionLabel,
                          isSelected && styles.statusOptionLabelActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={{ gap: Spacing.sm }}>
                {myStatus && (
                  <TouchableOpacity style={styles.clearStatusBtn} onPress={() => selectStatus(null)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    <Text style={styles.clearStatusText}>Durumu Temizle / Kaldır</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setStatusModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Radar Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          >
            <View style={styles.filterModalCard}>
              <View style={styles.filterModalHeader}>
                <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                  <Text style={styles.filterHeaderTitle}>Radar Filtreleri</Text>
                  <Text style={styles.filterHeaderSub}>
                    Çevrende kimleri görmek istediğini seç
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setFilterDistance(50)
                    setFilterGender('all')
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
                  }}
                  style={styles.resetBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resetBtnText}>Sıfırla</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionTitleRow}>
                  <Text style={styles.filterSectionTitle}>Maksimum Mesafe</Text>
                  <Text style={styles.filterSectionValue}>{filterDistance} km</Text>
                </View>
                <View style={styles.filterPillsGrid}>
                  {[10, 25, 50, 100].map((dist) => {
                    const isSelected = filterDistance === dist
                    return (
                      <TouchableOpacity
                        key={`modal-dist-${dist}`}
                        style={[
                          styles.filterOptionPill,
                          isSelected && styles.filterOptionPillActive,
                        ]}
                        onPress={() => {
                          setFilterDistance(dist)
                          Haptics.selectionAsync().catch(() => {})
                        }}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextActive,
                          ]}
                        >
                          {dist} km
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Cinsiyet</Text>
                <View style={styles.genderGrid}>
                  {[
                    { key: 'all', label: 'Herkes', icon: 'people-outline' },
                    { key: 'female', label: 'Kadınlar', icon: 'female-outline' },
                    { key: 'male', label: 'Erkekler', icon: 'male-outline' },
                  ].map((g) => {
                    const isSelected = filterGender === g.key
                    return (
                      <TouchableOpacity
                        key={`modal-gender-${g.key}`}
                        style={[styles.genderCard, isSelected && styles.genderCardActive]}
                        onPress={() => {
                          setFilterGender(g.key as any)
                          Haptics.selectionAsync().catch(() => {})
                        }}
                      >
                        <Ionicons
                          name={g.icon as any}
                          size={22}
                          color={isSelected ? '#fff' : Colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.genderCardText,
                            isSelected && styles.genderCardTextActive,
                          ]}
                        >
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setFilterModalVisible(false)
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.applyBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.applyBtnText}>
                    Filtreleri Uygula ({filteredUsers.length} kişi)
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <ProfileDetailSheet
          user={selectedUser}
          visible={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          isLiked={selectedUser ? likedUserIds.has(selectedUser.id) : false}
          hasLikedMe={selectedUser ? whoLikedMeIds.has(selectedUser.id) : false}
          onLike={
            selectedUser
              ? async () => {
                  try {
                    await api.likeUser(selectedUser.id, false, 'Yakınlardasın, selam! 👋')
                    setLikedUserIds((prev) => new Set(prev).add(selectedUser.id))
                  } catch (err) {
                    console.log('Error liking from nearby', err)
                  }
                }
              : undefined
          }
        />
        {/* LOCATION WARNING MODAL */}
        <Modal
          visible={locationWarningVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLocationWarningVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.statusModalCard, { alignItems: 'center' }]}>
              <Ionicons name="warning" size={48} color="#F59E0B" style={{ marginBottom: 12 }} />
              <Text style={styles.statusModalTitle}>Konumunuz Gizli</Text>
              <Text style={[styles.statusModalSub, { textAlign: 'center', marginBottom: 24, marginTop: 8 }]}>
                Haritada görünmez durumdayken bu özellikleri kullanamazsınız. Profil ayarlarınızdan "Haritada Görün" seçeneğini açmalısınız.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 100, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => setLocationWarningVisible(false)}
                >
                  <Text style={{ color: Colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>Kapat</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 100, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => {
                    setLocationWarningVisible(false)
                    router.push('/profile?highlight=showLocation')
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Git ve Aç</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ApprovalGuard>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1, width, height },

  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    pointerEvents: 'box-none',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontSize: 26,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(26, 23, 32, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  countBadgeText: { color: Colors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E676' },

  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26, 23, 32, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.sm,
  },
  weatherIcon: { fontSize: 14 },
  weatherText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  filterTriggerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 23, 32, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Shadows.sm,
  },
  filterTriggerBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.glow,
  },
  activeFilterDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#00E676',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  ghostAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232, 82, 106, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 82, 106, 0.3)',
  },
  ghostAlertText: { color: Colors.primary, fontSize: 11, fontWeight: FontWeight.bold },

  hiddenLocationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(235, 87, 87, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(235, 87, 87, 0.35)',
  },
  hiddenLocationText: { color: '#FF6B6B', fontSize: 11, fontWeight: FontWeight.bold },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
    backgroundColor: Colors.background,
  },
  errorIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(235,87,87,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  errorText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },
  retryBtn: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  retryGrad: { paddingVertical: Spacing.lg, alignItems: 'center' },
  retryText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  markerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    padding: 2,
    ...Shadows.glow,
  },
  markerLikedMe: {
    backgroundColor: '#FF2A6D',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...Shadows.glow,
  },
  markerImage: { width: 40, height: 40, borderRadius: 20 },
  markerPlaceholder: { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  likedMeBadge: {
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
    ...Shadows.sm,
  },
  likedMeBadgeText: { color: '#fff', fontSize: 9, fontWeight: FontWeight.bold },

  distanceBadge: {
    backgroundColor: 'rgba(15,13,18,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  distanceText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },

  myStatusPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: '#fff',
    ...Shadows.glow,
    flexDirection: 'row',
  },
  myStatusPillText: { color: '#fff', fontSize: 11, fontWeight: FontWeight.bold },
  myStatusArrow: {
    position: 'absolute',
    bottom: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
  },

  otherStatusPill: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Shadows.sm,
    flexDirection: 'row',
  },
  otherStatusPillText: { color: Colors.textPrimary, fontSize: 10, fontWeight: FontWeight.bold },
  otherStatusArrow: {
    position: 'absolute',
    bottom: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.surfaceElevated,
  },

  fab: { position: 'absolute', right: Spacing.xl, ...Shadows.lg, zIndex: 5 },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  zoomControls: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  zoomBtn: { padding: 12, alignItems: 'center', justifyContent: 'center' },
  zoomDivider: { height: 1, backgroundColor: Colors.border, width: '100%' },

  rightControls: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl + 80,
    gap: Spacing.md,
    zIndex: 4,
  },
  mapControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  mapControlBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  locatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  locatingBox: {
    backgroundColor: 'rgba(15,13,18,0.85)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(232,82,106,0.3)',
    ...Shadows.glow,
  },
  locatingText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  statusModalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadows.lg,
  },
  statusModalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statusModalSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statusOption: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusOptionActive: {
    backgroundColor: 'rgba(232,82,106,0.15)',
    borderColor: Colors.primary,
  },
  statusOptionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  statusOptionLabelActive: {
    color: Colors.primary,
  },
  clearStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(235, 87, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(235, 87, 87, 0.3)',
  },
  clearStatusText: {
    color: Colors.error,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  modalCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  modalCloseText: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },

  myMarkerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    padding: 3,
    borderWidth: 2,
    borderColor: '#fff',
    ...Shadows.glow,
  },
  myMarkerImage: { width: 40, height: 40, borderRadius: 20 },
  myMarkerPlaceholder: { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  myOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00E676',
    borderWidth: 2,
    borderColor: '#fff',
  },
  myLabelBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 3,
    borderWidth: 1,
    borderColor: '#fff',
    ...Shadows.sm,
  },
  myLabelText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.extrabold },

  filterModalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.lg,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  filterHeaderTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  filterHeaderSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(232, 82, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 82, 106, 0.3)',
  },
  resetBtnText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  filterSection: {
    marginTop: Spacing.lg,
  },
  filterSectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  filterSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  filterSectionValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  filterPillsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  filterOptionPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionPillActive: {
    backgroundColor: 'rgba(232, 82, 106, 0.15)',
    borderColor: Colors.primary,
  },
  filterOptionText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  filterOptionTextActive: {
    color: Colors.primary,
  },
  genderGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xs,
  },
  genderCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  genderCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.glow,
  },
  genderCardText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  genderCardTextActive: {
    color: '#fff',
  },
  applyBtn: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  applyBtnGrad: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
})