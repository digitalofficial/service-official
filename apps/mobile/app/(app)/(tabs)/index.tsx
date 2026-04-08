import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { useAuth } from '@/stores/auth'
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

export default function TodayScreen() {
  const profile = useAuth(s => s.profile)
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['jobs', 'today', today],
    queryFn: () => api.get<{ data: any[] }>(`/api/jobs?date=${today}`),
  })

  const jobs = (data as any)?.data ?? []
  const inProgress = jobs.filter((j: any) => j.status === 'in_progress').length
  const completed = jobs.filter((j: any) => j.status === 'completed').length

  return (
    <View style={styles.container}>
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hey, {profile?.first_name ?? 'there'}
        </Text>
        <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBadge label="Today" value={String(jobs.length)} color={colors.primary} />
        <StatBadge label="In Progress" value={String(inProgress)} color="#eab308" />
        <StatBadge label="Done" value={String(completed)} color={colors.success} />
      </View>

      {/* Jobs list */}
      <FlatList
        data={jobs}
        keyExtractor={(item: any) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No jobs scheduled for today'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.jobCard}
            onPress={() => router.push(`/(app)/(tabs)/jobs/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.jobHeader}>
              <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] ?? colors.textMuted) + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? colors.textMuted }]}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            {item.customer && (
              <Text style={styles.jobCustomer} numberOfLines={1}>
                {(item.customer as any).company_name ?? `${(item.customer as any).first_name} ${(item.customer as any).last_name}`}
              </Text>
            )}
            <View style={styles.jobMeta}>
              {item.scheduled_start && (
                <Text style={styles.jobTime}>
                  {format(new Date(item.scheduled_start), 'h:mm a')}
                </Text>
              )}
              {item.address_line1 && (
                <Text style={styles.jobAddress} numberOfLines={1}>
                  {[item.address_line1, item.city].filter(Boolean).join(', ')}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  greeting: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  date: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, padding: spacing.md, alignItems: 'center',
  },
  statValue: { fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  jobCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  jobCustomer: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 6 },
  jobMeta: { flexDirection: 'row', gap: spacing.md },
  jobTime: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  jobAddress: { fontSize: fontSize.xs, color: colors.textMuted, flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm },
})
