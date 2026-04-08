import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(userId: string, organizationId: string) {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return null
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted')
    return null
  }

  // Get Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  })
  const pushToken = tokenData.data

  // Save token to user's profile in Supabase
  try {
    await supabase
      .from('profiles')
      .update({ push_token: pushToken })
      .eq('id', userId)
  } catch (err) {
    // Column might not exist yet — that's OK, we'll add it
    console.log('Could not save push token:', err)
  }

  // iOS-specific: set badge count to 0 on launch
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(0)
  }

  return pushToken
}

export function addNotificationListeners(
  onReceived?: (notification: Notifications.Notification) => void,
  onTapped?: (response: Notifications.NotificationResponse) => void,
) {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    onReceived?.(notification)
  })

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onTapped?.(response)
  })

  return () => {
    receivedSub.remove()
    responseSub.remove()
  }
}
