import { View, Text, FlatList, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
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
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const pad = isTablet ? 40 : spacing.lg
  const numColumns = isTablet ? 2 : 1

  const { data: jobs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['jobs', 'today', today],
    queryFn: async () => {
      if (!profile?.organization_id) return []
      const start = `${today}T00:00:00`
      const end = `${today}T23:59:59`
      const { data, error } = await supabase
        .from('jobs')
        .select(`*, customer:customers(id, first_name, last_name, company_name, phone)`)
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_start', start)
        .lte('scheduled_start', end)
        .order('scheduled_start', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.organization_id,
  })

  const inProgress = jobs.filter((j: any) => j.status === 'in_progress').length
  const completed = jobs.filter((j: any) => j.status === 'completed').length

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={jobs}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item: any) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={{ paddingHorizontal: pad, paddingBottom: 100, maxWidth: 1200, alignSelf: 'center' as any, width: '100%' }}
        columnWrapperStyle={numColumns > 1 ? { gap: spacing.md } : undefined}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            {/* Greeting */}
            <View style={{ paddingTop: spacing.md, paddingBottom: spacing.sm }}>
              <Text style={{ fontSize: isTablet ? 32 : fontSize.xl, fontWeight: '800', color: colors.text }}>
                Hey, {profile?.first_name ?? 'there'}
              </Text>
              <Text style={{ fontSize: isTablet ? fontSize.md : fontSize.sm, color: colors.textSecondary, marginTop: 2 }}>
                {format(new Date(), 'EEEE, MMMM d')}
              </Text>
            </View>

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <StatBadge label="Today" value={String(jobs.length)} color={colors.primary} isTablet={isTablet} />
              <StatBadge label="In Progress" value={String(inProgress)} color="#eab308" isTablet={isTablet} />
              <StatBadge label="Done" value={String(completed)} color={colors.success} isTablet={isTablet} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: colors.textMuted, fontSize: isTablet ? fontSize.md : fontSize.sm }}>
              {isLoading ? 'Loading...' : 'No jobs scheduled for today'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              padding: isTablet ? spacing.lg : spacing.md,
              marginBottom: spacing.sm,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onPress={() => router.push(`/(app)/(tabs)/jobs/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: isTablet ? fontSize.lg : fontSize.md, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm }} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={{ backgroundColor: (STATUS_COLORS[item.status] ?? colors.textMuted) + '20', paddingHorizontal: isTablet ? 12 : 8, paddingVertical: isTablet ? 5 : 3, borderRadius: 99 }}>
                <Text style={{ fontSize: isTablet ? 13 : 11, fontWeight: '700', textTransform: 'capitalize', color: STATUS_COLORS[item.status] ?? colors.textMuted }}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            {item.customer && (
              <Text style={{ fontSize: isTablet ? fontSize.md : fontSize.sm, color: colors.textSecondary, marginBottom: 6 }} numberOfLines={1}>
                {(item.customer as any).company_name ?? `${(item.customer as any).first_name} ${(item.customer as any).last_name}`}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {item.scheduled_start && (
                <Text style={{ fontSize: isTablet ? fontSize.sm : fontSize.xs, color: colors.primary, fontWeight: '600' }}>
                  {format(new Date(item.scheduled_start), 'h:mm a')}
                </Text>
              )}
              {item.address_line1 && (
                <Text style={{ fontSize: isTablet ? fontSize.sm : fontSize.xs, color: colors.textMuted, flex: 1 }} numberOfLines={1}>
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

function StatBadge({ label, value, color, isTablet }: { label: string; value: string; color: string; isTablet: boolean }) {
  return (
    <View style={{
      flex: 1, backgroundColor: colors.card, borderRadius: radius.lg,
      borderWidth: 1, borderColor: color + '30',
      padding: isTablet ? spacing.lg : spacing.md, alignItems: 'center',
    }}>
      <Text style={{ fontSize: isTablet ? 32 : fontSize.xl, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: isTablet ? fontSize.sm : fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  )
}
