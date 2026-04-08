import { Tabs } from 'expo-router'
import { Platform, Text, useWindowDimensions } from 'react-native'
import { colors } from '@/lib/theme'

function TabIcon({ emoji, focused, isTablet }: { emoji: string; focused: boolean; isTablet: boolean }) {
  return <Text style={{ fontSize: isTablet ? 28 : 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
}

export default function TabLayout() {
  const { width } = useWindowDimensions()
  const isTablet = width >= 768

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: isTablet ? { fontSize: 20 } : undefined,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? (isTablet ? 28 : 24) : 8,
          paddingTop: isTablet ? 12 : 8,
          height: Platform.OS === 'ios' ? (isTablet ? 100 : 88) : 64,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: isTablet ? 13 : 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} isTablet={isTablet} />,
          tabBarLabel: 'Today',
          headerTitle: 'Today',
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔧" focused={focused} isTablet={isTablet} />,
          tabBarLabel: 'Jobs',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} isTablet={isTablet} />,
          tabBarLabel: 'Messages',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} isTablet={isTablet} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  )
}
