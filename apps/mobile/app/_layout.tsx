import { useEffect, useRef } from 'react'
import { Slot, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/stores/auth'
import { registerForPushNotifications, addNotificationListeners } from '@/lib/notifications'

const queryClient = new QueryClient()

export default function RootLayout() {
  const initialize = useAuth(s => s.initialize)
  const session = useAuth(s => s.session)
  const profile = useAuth(s => s.profile)
  const notifCleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    initialize()
  }, [])

  // Register push notifications when user is authenticated
  useEffect(() => {
    if (session?.user && profile) {
      registerForPushNotifications(session.user.id, profile.organization_id)

      notifCleanup.current = addNotificationListeners(
        // Notification received while app is open
        (notification) => {
          const data = notification.request.content.data
          // Refresh relevant queries
          if (data?.type === 'job_assigned' || data?.type === 'job_status_update') {
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
          }
          if (data?.type === 'message_received') {
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
          }
        },
        // User tapped on notification
        (response) => {
          const data = response.notification.request.content.data
          if (data?.job_id) {
            router.push(`/(app)/(tabs)/jobs/${data.job_id}`)
          } else if (data?.type === 'message_received') {
            router.push('/(app)/(tabs)/messages')
          }
        },
      )
    }

    return () => {
      notifCleanup.current?.()
    }
  }, [session?.user?.id, profile?.id])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Slot />
    </QueryClientProvider>
  )
}
