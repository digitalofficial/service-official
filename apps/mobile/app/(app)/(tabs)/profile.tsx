import { View, Text, TouchableOpacity, ScrollView, Alert, useWindowDimensions } from 'react-native'
import { useAuth } from '@/stores/auth'
import { colors, spacing, radius, fontSize } from '@/lib/theme'

export default function ProfileScreen() {
  const { profile, signOut } = useAuth()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const pad = isTablet ? 40 : spacing.lg

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: pad, maxWidth: 600, alignSelf: 'center' as any, width: '100%' }}
    >
      {/* Avatar */}
      <View style={{ alignItems: 'center', marginVertical: isTablet ? spacing.xxl : spacing.xl }}>
        <View style={{
          width: isTablet ? 120 : 80, height: isTablet ? 120 : 80,
          borderRadius: isTablet ? 60 : 40,
          backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: isTablet ? 44 : fontSize.xxl, fontWeight: '800', color: 'white' }}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </Text>
        </View>
        <Text style={{ fontSize: isTablet ? 28 : fontSize.xl, fontWeight: '700', color: colors.text, marginTop: spacing.md }}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={{ fontSize: isTablet ? fontSize.md : fontSize.sm, color: colors.textSecondary, marginTop: 2 }}>
          {profile?.email}
        </Text>
        <Text style={{ fontSize: isTablet ? fontSize.sm : fontSize.xs, color: colors.primary, fontWeight: '600', textTransform: 'capitalize', marginTop: spacing.xs }}>
          {profile?.role?.replace(/_/g, ' ')}
        </Text>
      </View>

      {/* Info cards */}
      <View style={{
        backgroundColor: colors.card, borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
      }}>
        {profile?.phone && (
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between',
            paddingHorizontal: isTablet ? spacing.lg : spacing.md,
            paddingVertical: isTablet ? 18 : 14,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <Text style={{ fontSize: isTablet ? fontSize.md : fontSize.sm, color: colors.textSecondary }}>Phone</Text>
            <Text style={{ fontSize: isTablet ? fontSize.md : fontSize.sm, color: colors.text, fontWeight: '500' }}>{profile.phone}</Text>
          </View>
        )}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between',
          paddingHorizontal: isTablet ? spacing.lg : spacing.md,
          paddingVertical: isTablet ? 18 : 14,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <Text style={{ fontSize: isTablet ? fontSize.md : fontSize.sm, color: colors.textSecondary }}>Email</Text>
          <Text style={{ fontSize: isTablet ? fontSize.md : fontSize.sm, color: colors.text, fontWeight: '500' }}>{profile?.email}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: colors.danger + '15', borderRadius: radius.lg,
          paddingVertical: isTablet ? 20 : 16, alignItems: 'center',
          borderWidth: 1, borderColor: colors.danger + '30',
        }}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <Text style={{ color: colors.danger, fontSize: isTablet ? fontSize.lg : fontSize.md, fontWeight: '600' }}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: isTablet ? fontSize.sm : fontSize.xs, marginTop: spacing.xl }}>
        Service Official v1.0.0
      </Text>
    </ScrollView>
  )
}
