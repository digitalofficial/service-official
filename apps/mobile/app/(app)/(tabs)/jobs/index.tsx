import { View, Text, FlatList, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Stack, router } from 'expo-router'
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

export default function JobsScreen() {
  const profile = useAuth(s => s.profile)
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const pad = isTablet ? 40 : spacing.lg
  const numColumns = isTablet ? 2 : 1

  const { data: jobs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: async () => {
      if (!profile?.organization_id) return []
      const { data, error } = await supabase
        .from('jobs')
        .select(`*, customer:customers(id, first_name, last_name, company_name, phone)`)
        .eq('organization_id', profile.organization_id)
        .order('scheduled_start', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.organization_id,
  })

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: 'Jobs', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false }} />
      <FlatList
        data={jobs}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item: any) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={{ padding: pad, paddingBottom: 100, maxWidth: 1200, alignSelf: 'center' as any, width: '100%' }}
        columnWrapperStyle={numColumns > 1 ? { gap: spacing.md } : undefined}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: colors.textMuted, fontSize: isTablet ? fontSize.md : fontSize.sm }}>
              {isLoading ? 'Loading...' : 'No jobs found'}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
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
              <Text style={{ fontSize: isTablet ? fontSize.md : fontSize.sm, color: colors.textSecondary, marginBottom: 4 }} numberOfLines={1}>
                {(item.customer as any).company_name ?? `${(item.customer as any).first_name} ${(item.customer as any).last_name}`}
              </Text>
            )}
            {item.scheduled_start && (
              <Text style={{ fontSize: isTablet ? fontSize.sm : fontSize.xs, color: colors.primary, fontWeight: '600', marginBottom: 2 }}>
                {format(new Date(item.scheduled_start), 'EEE, MMM d · h:mm a')}
              </Text>
            )}
            {item.address_line1 && (
              <Text style={{ fontSize: isTablet ? fontSize.sm : fontSize.xs, color: colors.textMuted }} numberOfLines={1}>
                {[item.address_line1, item.city, item.state].filter(Boolean).join(', ')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
