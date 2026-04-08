import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { colors, spacing, radius, fontSize } from '@/lib/theme'

const STATUS_FLOW = ['scheduled', 'en_route', 'on_site', 'in_progress', 'completed'] as const
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Start Route',
  en_route: 'Arrive On Site',
  on_site: 'Start Work',
  in_progress: 'Complete Job',
}
const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.primary,
  en_route: colors.warning,
  on_site: colors.warning,
  in_progress: '#eab308',
  completed: colors.success,
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get<{ data: any }>(`/api/jobs/${id}`),
  })

  const job = (data as any)?.data

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => api.patch(`/api/jobs/${id}`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  })

  const handleAdvanceStatus = () => {
    if (!job) return
    const currentIdx = STATUS_FLOW.indexOf(job.status)
    if (currentIdx === -1 || currentIdx >= STATUS_FLOW.length - 1) return
    const nextStatus = STATUS_FLOW[currentIdx + 1]

    if (nextStatus === 'completed') {
      Alert.alert('Complete Job', 'Mark this job as completed?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => statusMutation.mutate(nextStatus) },
      ])
    } else {
      statusMutation.mutate(nextStatus)
    }
  }

  const nextAction = job ? STATUS_LABELS[job.status] : null
  const customer = job?.customer as any

  const openMaps = () => {
    if (!job?.address_line1) return
    const addr = encodeURIComponent([job.address_line1, job.city, job.state, job.zip].filter(Boolean).join(', '))
    Linking.openURL(`https://maps.apple.com/?daddr=${addr}`)
  }

  const callCustomer = () => {
    if (!customer?.phone) return
    Linking.openURL(`tel:${customer.phone}`)
  }

  if (isLoading || !job) {
    return (
      <View style={styles.loader}>
        <Stack.Screen options={{ title: 'Job', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: job.title, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false }} />

      {/* Status + Action */}
      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          {STATUS_FLOW.map((s, i) => {
            const idx = STATUS_FLOW.indexOf(job.status)
            const isDone = i <= idx
            const color = isDone ? (STATUS_COLORS[s] ?? colors.textMuted) : colors.border
            return (
              <View key={s} style={styles.statusStep}>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text style={[styles.statusStepLabel, isDone && { color: colors.text }]}>
                  {s.replace(/_/g, ' ')}
                </Text>
              </View>
            )
          })}
        </View>

        {nextAction && (
          <TouchableOpacity
            style={[styles.actionButton, statusMutation.isPending && { opacity: 0.6 }]}
            onPress={handleAdvanceStatus}
            disabled={statusMutation.isPending}
            activeOpacity={0.8}
          >
            {statusMutation.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.actionText}>{nextAction}</Text>
            )}
          </TouchableOpacity>
        )}

        {job.status === 'completed' && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>Job Completed</Text>
          </View>
        )}
      </View>

      {/* Customer */}
      {customer && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Customer</Text>
          <Text style={styles.cardTitle}>
            {customer.company_name ?? `${customer.first_name} ${customer.last_name}`}
          </Text>
          <View style={styles.quickActions}>
            {customer.phone && (
              <TouchableOpacity style={styles.quickButton} onPress={callCustomer}>
                <Text style={styles.quickButtonText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Location */}
      {job.address_line1 && (
        <TouchableOpacity style={styles.card} onPress={openMaps} activeOpacity={0.7}>
          <Text style={styles.cardLabel}>Location</Text>
          <Text style={styles.cardTitle}>{job.address_line1}</Text>
          <Text style={styles.cardSub}>
            {[job.city, job.state, job.zip].filter(Boolean).join(', ')}
          </Text>
          <Text style={styles.mapLink}>Open in Maps</Text>
        </TouchableOpacity>
      )}

      {/* Schedule */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Schedule</Text>
        {job.scheduled_start ? (
          <Text style={styles.cardTitle}>
            {format(new Date(job.scheduled_start), 'EEEE, MMMM d · h:mm a')}
          </Text>
        ) : (
          <Text style={styles.cardSub}>Not scheduled yet</Text>
        )}
        {job.scheduled_end && (
          <Text style={styles.cardSub}>
            Until {format(new Date(job.scheduled_end), 'h:mm a')}
          </Text>
        )}
      </View>

      {/* Instructions */}
      {job.instructions && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Instructions</Text>
          <Text style={styles.instructions}>{job.instructions}</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  loader: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  statusSection: { marginBottom: spacing.lg },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  statusStep: { alignItems: 'center', flex: 1 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  statusStepLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'capitalize', textAlign: 'center' },
  actionButton: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  actionText: { color: 'white', fontSize: fontSize.md, fontWeight: '700' },
  completedBanner: {
    backgroundColor: colors.success + '20', borderRadius: radius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  completedText: { color: colors.success, fontSize: fontSize.md, fontWeight: '700' },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  cardLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickButton: {
    backgroundColor: colors.primary + '20', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.md,
  },
  quickButtonText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  mapLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm },
  instructions: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22 },
})
