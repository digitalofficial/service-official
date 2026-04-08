import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Stack, router } from 'expo-router'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { colors, spacing, radius, fontSize } from '@/lib/theme'

const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.primary,
  en_route: colors.warning,
  on_site: colors.warning,
  in_progress: '#eab308',
  completed: colors.success,
  needs_follow_up: colors.danger,
  canceled: colors.textMuted,
  unscheduled: colors.textMuted,
}

export default function JobsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => api.get<{ data: any[] }>('/api/jobs'),
  })

  const jobs = (data as any)?.data ?? []

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Jobs', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false }} />
      <FlatList
        data={jobs}
        keyExtractor={(item: any) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{isLoading ? 'Loading...' : 'No jobs found'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/(tabs)/jobs/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.row}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] ?? colors.textMuted) + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] ?? colors.textMuted }]}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            {item.customer && (
              <Text style={styles.customer} numberOfLines={1}>
                {(item.customer as any).company_name ?? `${(item.customer as any).first_name} ${(item.customer as any).last_name}`}
              </Text>
            )}
            {item.scheduled_start && (
              <Text style={styles.meta}>
                {format(new Date(item.scheduled_start), 'EEE, MMM d · h:mm a')}
              </Text>
            )}
            {item.address_line1 && (
              <Text style={styles.address} numberOfLines={1}>
                {[item.address_line1, item.city, item.state].filter(Boolean).join(', ')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  customer: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 4 },
  meta: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600', marginBottom: 2 },
  address: { fontSize: fontSize.xs, color: colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm },
})
