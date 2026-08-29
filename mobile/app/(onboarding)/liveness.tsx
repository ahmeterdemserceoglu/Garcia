import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as FaceDetector from 'expo-face-detector'
import { router } from 'expo-router'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/auth'

export default function LivenessScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [faces, setFaces] = useState<FaceDetector.FaceFeature[]>([])
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0)
  
  useEffect(() => {
    if (faces.length > 0) {
      const face = faces[0]
      // step 0: position face
      if (step === 0 && face.bounds.size.width > 150) {
        setStep(1)
      } 
      // step 1: turn right (yawAngle > 20)
      else if (step === 1 && face.yawAngle && face.yawAngle > 20) {
        setStep(2)
      }
      // step 2: turn left (yawAngle < -20)
      else if (step === 2 && face.yawAngle && face.yawAngle < -20) {
        setStep(3)
      }
      // step 3: smile
      else if (step === 3 && (face.smilingProbability ?? 0) > 0.7) {
        setStep(4)
      }
    }
  }, [faces, step])

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (step === 4) {
      timeout = setTimeout(() => {
        router.replace('/(tabs)/discover')
      }, 2000)
    }
    return () => clearTimeout(timeout)
  }, [step])

  const handleFacesDetected = ({ faces }: { faces: FaceDetector.FaceFeature[] }) => {
    setFaces(faces)
  }

  if (!permission) return <View style={styles.container} />
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kamera izni gerekiyor</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="front"
        // @ts-ignore
        onFacesDetected={handleFacesDetected}
        // @ts-ignore
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Gerçeklik Kontrolü</Text>
          <Text style={styles.subtitle}>
            {step === 0 && "Lütfen yüzünüzü çerçeveye ortalayın"}
            {step === 1 && "Şimdi kafanızı hafifçe SAĞA çevirin 👉"}
            {step === 2 && "Şimdi kafanızı hafifçe SOLA çevirin 👈"}
            {step === 3 && "Son olarak kocaman GÜLÜMSEYİN! 😊"}
            {step === 4 && "Harika! Kimliğiniz doğrulandı. ✅"}
          </Text>
        </View>

        <View style={[styles.frame, step === 4 && styles.frameSuccess]} />

        {step === 4 && (
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
          </View>
        )}
      </View>
      <View style={styles.privacyContainer}>
        <Ionicons name="shield-checkmark" size={16} color="#aaa" style={{marginRight: 6}} />
        <Text style={styles.privacyText}>Güvenliğiniz için hiçbir fotoğraf veya video cihazınıza/sunucuya kaydedilmez.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 80 },
  header: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20, borderRadius: 20, marginHorizontal: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#ddd', fontSize: 16, marginTop: 10, textAlign: 'center' },
  privacyContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 10 },
  privacyText: { color: '#aaa', fontSize: 12, textAlign: 'center', flexShrink: 1 },
  frame: {
    width: 300,
    height: 400,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 200,
  },
  frameSuccess: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(232, 82, 106, 0.2)',
  },
  successBadge: {
    position: 'absolute',
    top: '50%',
    marginTop: -40,
    backgroundColor: '#fff',
    borderRadius: 50,
  },
  text: { color: '#fff', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  btn: { backgroundColor: Colors.primary, padding: 15, borderRadius: 30, width: 200, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
