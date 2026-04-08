import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useAuth } from '@/stores/auth'
import { colors, spacing, radius, fontSize } from '@/lib/theme'

export default function ProfileScreen() {
  const { profile, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.first_name} {profile?.last_name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <Text style={styles.role}>{profile?.role?.replace(/_/g, ' ')}</Text>
      </View>

      {/* Info cards */}
      <View style={styles.card}>
        {profile?.phone && (
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{profile.phone}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile?.email}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Service Official v1.0.0</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  avatarSection: { alignItems: 'center', marginVertical: spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontSize: fontSize.xxl, fontWeight: '800', color: 'white' },
  name: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  email: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  role: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600', textTransform: 'capitalize', marginTop: spacing.xs },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
  signOutButton: {
    backgroundColor: colors.danger + '15', borderRadius: radius.lg,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: colors.danger + '30',
  },
  signOutText: { color: colors.danger, fontSize: fontSize.md, fontWeight: '600' },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xl },
})
