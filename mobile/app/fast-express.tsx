import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native'

import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'

import {
  Colors,
  Shadows,
} from '../constants/Colors'

import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
} from '../constants/Spacing'

import { api } from '../api/client'
import { useAlertStore } from '../store/alertStore'

/* =========================================================
   AGORA
========================================================= */

let createAgoraRtcEngine: any = null
let ChannelProfileType: any = null
let ClientRoleType: any = null
let RtcSurfaceView: any = View

try {
  const Agora = require('react-native-agora')

  createAgoraRtcEngine =
    Agora.createAgoraRtcEngine

  ChannelProfileType =
    Agora.ChannelProfileType

  ClientRoleType =
    Agora.ClientRoleType

  RtcSurfaceView =
    Agora.RtcSurfaceView || View
} catch {
  console.log(
    '[Garcia] Agora native module bulunamadı.'
  )
}

/* =========================================================
   CONFIG
========================================================= */

const APP_ID =
  'da4209d67beb4bceaf306bbad440c0ff'

const GARCIA_PINK = '#FF416C'
const GARCIA_ORANGE = '#FF4B2B'

/* =========================================================
   SCREEN
========================================================= */

function FastExpressScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [searching, setSearching] =
    useState(false)

  const [inCall, setInCall] =
    useState(false)

  const [partnerJoined, setPartnerJoined] =
    useState(false)

  const [partnerUid, setPartnerUid] =
    useState<number | null>(null)

  const agoraEngineRef =
    useRef<any>(null)

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      try {
        if (agoraEngineRef.current) {
          agoraEngineRef.current.leaveChannel()
          agoraEngineRef.current.release()
          agoraEngineRef.current = null
        }
      } catch (error) {
        console.log(
          '[Garcia] Agora cleanup error:',
          error
        )
      }
    }
  }, [])

  /* =======================================================
     PERMISSIONS
  ======================================================= */

  const getPermission = async () => {
    if (Platform.OS !== 'android') {
      return true
    }

    try {
      const result =
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ])

      const microphoneGranted =
        result[
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        ] ===
        PermissionsAndroid.RESULTS.GRANTED

      const cameraGranted =
        result[
          PermissionsAndroid.PERMISSIONS.CAMERA
        ] ===
        PermissionsAndroid.RESULTS.GRANTED

      if (
        !microphoneGranted ||
        !cameraGranted
      ) {
        useAlertStore
          .getState()
          .showAlert(
            'İzin Gerekli',
            'Hızlı Express için kamera ve mikrofon izinlerini vermen gerekiyor.'
          )

        return false
      }

      return true
    } catch (error) {
      console.log(
        '[Garcia] Permission error:',
        error
      )

      return false
    }
  }

  /* =======================================================
     AGORA INIT
  ======================================================= */

  const initAgora = async () => {
    if (!createAgoraRtcEngine) {
      throw new Error(
        'Agora native module bulunamadı.'
      )
    }

    try {
      // Önce eski instance varsa temizle
      if (agoraEngineRef.current) {
        try {
          agoraEngineRef.current.leaveChannel()
          agoraEngineRef.current.release()
        } catch {}

        agoraEngineRef.current = null
      }

      const engine =
        createAgoraRtcEngine()

      if (!engine) {
        throw new Error(
          'Agora engine oluşturulamadı.'
        )
      }

      agoraEngineRef.current = engine

      engine.initialize({
        appId: APP_ID,
      })

      engine.enableVideo()

      engine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log(
            '[Garcia] Agora channel bağlantısı başarılı.'
          )
        },

        onUserJoined: (
          _connection: any,
          uid: number
        ) => {
          console.log(
            '[Garcia] Kullanıcı katıldı:',
            uid
          )

          setPartnerJoined(true)
          setPartnerUid(uid)

          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => {})
        },

        onUserOffline: (
          _connection: any,
          uid: number
        ) => {
          console.log(
            '[Garcia] Kullanıcı ayrıldı:',
            uid
          )

          setPartnerJoined(false)
          setPartnerUid(null)

          endCall()
        },
      })

      return engine
    } catch (error) {
      console.log(
        '[Garcia] Agora init error:',
        error
      )

      agoraEngineRef.current = null

      throw error
    }
  }

  /* =======================================================
     START SEARCH
  ======================================================= */

  const startSearch = async () => {
    if (searching) {
      return
    }

    if (!createAgoraRtcEngine) {
      useAlertStore
        .getState()
        .showAlert(
          'Yerel Derleme Gerekli',
          'Görüntülü Hızlı Express için Expo Go yerine yerel Android derlemesi kullanmalısın.'
        )

      return
    }

    try {
      await Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Heavy
      )
    } catch {}

    setSearching(true)

    try {
      const permissionGranted =
        await getPermission()

      if (!permissionGranted) {
        setSearching(false)
        return
      }

      const engine =
        await initAgora()

      const { data } =
        await api.startFastExpress()

      if (!data?.channelName) {
        useAlertStore
          .getState()
          .showAlert(
            'Arama Sonucu',
            'Şu an Hızlı Express arayan kimse yok.'
          )

        try {
          engine.leaveChannel()
          engine.release()
        } catch {}

        agoraEngineRef.current = null

        return
      }

      engine.joinChannel(
        '',
        data.channelName,
        0,
        {
          channelProfile:
            ChannelProfileType
              ?.ChannelProfileCommunication,

          clientRoleType:
            ClientRoleType
              ?.ClientRoleBroadcaster,

          publishMicrophoneTrack: true,
          publishCameraTrack: true,

          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        }
      )

      setPartnerJoined(false)
      setPartnerUid(null)
      setInCall(true)
    } catch (error) {
      console.log(
        '[Garcia] Hızlı Express başlatma hatası:',
        error
      )

      useAlertStore
        .getState()
        .showAlert(
          'Bağlantı Hatası',
          'Hızlı Express başlatılamadı. Lütfen tekrar deneyin.'
        )

      try {
        if (agoraEngineRef.current) {
          agoraEngineRef.current.leaveChannel()
          agoraEngineRef.current.release()
        }
      } catch {}

      agoraEngineRef.current = null

      setInCall(false)
      setPartnerJoined(false)
      setPartnerUid(null)
    } finally {
      setSearching(false)
    }
  }

  /* =======================================================
     END CALL
  ======================================================= */

  const endCall = () => {
    try {
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Medium
      ).catch(() => {})
    } catch {}

    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.leaveChannel()
        agoraEngineRef.current.release()
        agoraEngineRef.current = null
      }
    } catch (error) {
      console.log(
        '[Garcia] Agora leave error:',
        error
      )

      agoraEngineRef.current = null
    }

    setInCall(false)
    setPartnerJoined(false)
    setPartnerUid(null)
  }

  /* =======================================================
     LIKE
  ======================================================= */

  const handleLike = () => {
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => {})

    useAlertStore
      .getState()
      .showAlert(
        'Tebrikler ❤️',
        'Beğendiniz! Eşleşme durumu yakında bildirilecek.'
      )

    endCall()
  }

  /* =======================================================
     VIDEO CALL SCREEN
  ======================================================= */

  if (inCall) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            backgroundColor: '#000',
          },
        ]}
      >
        <View style={styles.callHeader}>
          <View>
            <Text style={styles.callTitle}>
              Hızlı Express
            </Text>

            <Text style={styles.callSubtitle}>
              {partnerJoined
                ? 'Bağlantı kuruldu'
                : 'Birisi aranıyor...'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={endCall}
            style={styles.endCallHeaderBtn}
            activeOpacity={0.8}
          >
            <Ionicons
              name="close"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.videoContainer}>
          {partnerJoined &&
          partnerUid !== null ? (
            <RtcSurfaceView
              canvas={{
                uid: partnerUid,
              }}
              style={styles.remoteVideo}
            />
          ) : (
            <LinearGradient
              colors={[
                '#1A1A1A',
                '#090909',
              ]}
              style={styles.waitingContainer}
            >
              <View
                style={
                  styles.waitingIcon
                }
              >
                <Ionicons
                  name="flash"
                  size={32}
                  color="#fff"
                />
              </View>

              <ActivityIndicator
                size="large"
                color="#fff"
              />

              <Text
                style={styles.waitingText}
              >
                Karşı taraf aranıyor...
              </Text>

              <Text
                style={
                  styles.waitingSubtext
                }
              >
                Hazır olduğunda kamera
                otomatik bağlanacak.
              </Text>
            </LinearGradient>
          )}

          {/* LOCAL VIDEO */}

          <View
            style={styles.localVideoWrapper}
          >
            <RtcSurfaceView
              canvas={{
                uid: 0,
              }}
              style={styles.localVideo}
            />

            <View
              style={
                styles.localVideoBorder
              }
            />
          </View>

          {/* LIVE BADGE */}

          {partnerJoined && (
            <View
              style={styles.liveBadge}
            >
              <View
                style={styles.liveDot}
              />

              <Text
                style={styles.liveText}
              >
                BAĞLANDI
              </Text>
            </View>
          )}
        </View>

        {/* ACTIONS */}

        {partnerJoined && (
          <View
            style={[
              styles.actionRow,
              {
                paddingBottom:
                  insets.bottom + 20,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.passBtn}
              onPress={endCall}
              activeOpacity={0.8}
            >
              <Ionicons
                name="close"
                size={32}
                color="#FF3B30"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.likeBtn}
              onPress={handleLike}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[
                  GARCIA_PINK,
                  GARCIA_ORANGE,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.likeGradient}
              >
                <Ionicons
                  name="heart"
                  size={36}
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  /* =======================================================
     MAIN SCREEN
  ======================================================= */

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      <LinearGradient
        colors={[
          GARCIA_PINK,
          GARCIA_ORANGE,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* DECORATIVE GLOW */}

      <View
        pointerEvents="none"
        style={styles.glowOne}
      />

      <View
        pointerEvents="none"
        style={styles.glowTwo}
      />

      {/* CLOSE */}

      <TouchableOpacity
        onPress={() => router.back()}
        style={[
          styles.backBtn,
          {
            top: insets.top + 12,
          },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons
          name="close"
          size={27}
          color="#fff"
        />
      </TouchableOpacity>

      {/* CONTENT */}

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name="flash"
            size={64}
            color="#fff"
          />
        </View>

        <Text style={styles.title}>
          Hızlı Express
        </Text>

        <Text style={styles.subtitle}>
          Yüz yüze tanışmanın en hızlı yolu.
          {'\n'}
          Kameranı aç, biriyle rastgele
          eşleş, 3 dakika sohbet et.
          {'\n'}
          Karşılıklı beğenirseniz
          eşleşirsiniz!
        </Text>

        {!searching ? (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={startSearch}
            activeOpacity={0.85}
          >
            <View
              style={styles.btnInner}
            >
              <Text
                style={
                  styles.startBtnText
                }
              >
                Flörte Başla
              </Text>

              <View
                style={
                  styles.startIconCircle
                }
              >
                <Ionicons
                  name="videocam"
                  size={19}
                  color={GARCIA_PINK}
                />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View
            style={styles.searchingBox}
          >
            <ActivityIndicator
              size="large"
              color="#fff"
            />

            <Text
              style={
                styles.searchingText
              }
            >
              Express flörtler aranıyor...
            </Text>

            <Text
              style={
                styles.searchingSubtext
              }
            >
              Sana uygun biri bulunuyor
            </Text>
          </View>
        )}

        {/* BOTTOM INFO */}

        {!searching && (
          <View
            style={styles.featureRow}
          >
            <View
              style={styles.feature}
            >
              <View
                style={
                  styles.featureIcon
                }
              >
                <Ionicons
                  name="videocam-outline"
                  size={17}
                  color="#fff"
                />
              </View>

              <Text
                style={
                  styles.featureText
                }
              >
                Görüntülü
              </Text>
            </View>

            <View
              style={styles.feature}
            >
              <View
                style={
                  styles.featureIcon
                }
              >
                <Ionicons
                  name="timer-outline"
                  size={17}
                  color="#fff"
                />
              </View>

              <Text
                style={
                  styles.featureText
                }
              >
                3 dakika
              </Text>
            </View>

            <View
              style={styles.feature}
            >
              <View
                style={
                  styles.featureIcon
                }
              >
                <Ionicons
                  name="heart-outline"
                  size={17}
                  color="#fff"
                />
              </View>

              <Text
                style={
                  styles.featureText
                }
              >
                Eşleş
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default FastExpressScreen

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  /* MAIN */

  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.35)',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor:
      'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor:
      'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.glow,
  },

  title: {
    fontSize: 32,
    fontWeight:
      FontWeight.extrabold,
    color: '#fff',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: FontSize.md,
    color:
      'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 34,
  },

  startBtn: {
    width: '100%',
    height: 62,
    borderRadius:
      BorderRadius.full,
    backgroundColor: '#fff',
    ...Shadows.glow,
  },

  btnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  startBtnText: {
    color: GARCIA_PINK,
    fontSize: FontSize.lg,
    fontWeight:
      FontWeight.bold,
  },

  startIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,65,108,0.10)',
  },

  searchingBox: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },

  searchingText: {
    color: '#fff',
    fontSize: FontSize.md,
    marginTop: Spacing.md,
    fontWeight: '700',
  },

  searchingSubtext: {
    color:
      'rgba(255,255,255,0.70)',
    fontSize: 11,
    marginTop: 6,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 28,
  },

  feature: {
    alignItems: 'center',
    gap: 6,
  },

  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.20)',
  },

  featureText: {
    color:
      'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontWeight: '700',
  },

  glowOne: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor:
      'rgba(255,255,255,0.06)',
    top: -150,
    right: -100,
  },

  glowTwo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor:
      'rgba(255,255,255,0.05)',
    bottom: -120,
    left: -90,
  },

  /* CALL */

  callHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  callTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  callSubtitle: {
    color:
      'rgba(255,255,255,0.55)',
    fontSize: 10,
    marginTop: 3,
  },

  endCallHeaderBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.12)',
    borderRadius: 21,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.15)',
  },

  videoContainer: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 22,
    margin: 10,
    overflow: 'hidden',
    position: 'relative',
  },

  remoteVideo: {
    flex: 1,
  },

  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  waitingIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,65,108,0.85)',
    marginBottom: 22,
    ...Shadows.glow,
  },

  waitingText: {
    color: '#fff',
    marginTop: 13,
    fontSize: 15,
    fontWeight: '700',
  },

  waitingSubtext: {
    color:
      'rgba(255,255,255,0.50)',
    marginTop: 6,
    fontSize: 10,
    textAlign: 'center',
  },

  localVideoWrapper: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 105,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#fff',
    ...Shadows.md,
  },

  localVideo: {
    flex: 1,
  },

  localVideoBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.35)',
  },

  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 10,
    height: 29,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(0,0,0,0.55)',
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor:
      '#42E37B',
    marginRight: 6,
  },

  liveText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent:
      'space-evenly',
    alignItems: 'center',
    paddingTop: 20,
  },

  passBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },

  likeBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    ...Shadows.glow,
  },

  likeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})