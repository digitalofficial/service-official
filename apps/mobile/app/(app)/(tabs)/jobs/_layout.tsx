import { Stack } from 'expo-router'
import { colors } from '@/lib/theme'

export default function JobsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    />
  )
}
