import { Tabs } from 'expo-router'
import { View, StyleSheet, Platform } from 'react-native'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useMatchesStore } from '../../store/matches'
import { useAuthStore } from '../../store/auth'
import { EmailGuard } from '../../components/EmailGuard'

function TabIcon({ focused, iconName, hasBadge }: { focused: boolean; iconName: any; hasBadge?: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Ionicons 
        name={focused ? iconName : `${iconName}-outline`} 
        size={28} 
        color={focused ? Colors.primary : Colors.tabInactive} 
      />
      {focused && <View style={styles.tabDot} />}
      {hasBadge && (
        <View style={styles.tabBadge} />
      )}
    </View>
  )
}

export default function TabsLayout() {
  const { matches } = useMatchesStore()
  const { user } = useAuthStore()
  const hasUnreadMessages = matches.some(m => 
    m.messages && m.messages[0] && 
    !m.messages[0].isRead && 
    m.messages[0].senderId !== user?.id
  )

  return (
    <EmailGuard>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} iconName="flame" />,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: 'Beğeniler',
          tabBarIcon: ({ color }) => <Ionicons name="heart" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="nearby"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} iconName="location" />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} iconName="chatbubbles" hasBadge={hasUnreadMessages} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} iconName="calendar" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} iconName="person" />,
        }}
      />
      <Tabs.Screen name="chat" options={{ href: null }} />
    </Tabs>
    </EmailGuard>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F0D12',
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
    elevation: 0,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: 18,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#0F0D12'
  }
})
