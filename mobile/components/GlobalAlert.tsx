import React from 'react'
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAlertStore } from '../store/alertStore'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'

export function GlobalAlert() {
  const { visible, title, message, buttons, hideAlert } = useAlertStore()

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  btn.style === 'cancel' && styles.buttonCancel,
                  btn.style === 'destructive' && styles.buttonDestructive,
                ]}
                onPress={() => {
                  hideAlert()
                  if (btn.onPress) btn.onPress()
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    btn.style === 'cancel' && styles.buttonTextCancel,
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
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
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  buttonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonTextCancel: {
    color: Colors.textMuted,
  },
  buttonDestructive: {
    backgroundColor: Colors.error,
  },
})
