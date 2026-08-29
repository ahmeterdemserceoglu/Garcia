import React from 'react'
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Animated, TouchableWithoutFeedback, Easing
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'

interface ErrorModalProps {
  visible: boolean
  title?: string
  message: string
  onClose: () => void
}

export default function ErrorModal({ visible, title = 'Hata', message, onClose }: ErrorModalProps) {
  const [fadeAnim] = React.useState(new Animated.Value(0))
  const [scaleAnim] = React.useState(new Animated.Value(0.9))

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start()
      scaleAnim.setValue(0.9)
    }
  }, [visible])

  if (!visible) return null

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.iconContainer}>
                <Ionicons name="alert-circle" size={48} color={Colors.error || '#FF4B4B'} />
              </View>
              
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              
              <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.buttonText}>Tamam</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: (Colors.error || '#FF4B4B') + '15', // 15 is hex for ~8% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  }
})
