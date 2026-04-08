import { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, ActivityIndicator, ActionSheetIOS, Platform,
  TextInput, Modal, FlatList, SectionList, useWindowDimensions,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { colors, spacing, radius, fontSize } from '@/lib/theme'
import { MATERIALS_CATALOG, MATERIAL_CATEGORIES, type CatalogItem } from '@/lib/materials-catalog'

const STATUS_FLOW = ['scheduled', 'en_route', 'on_site', 'in_progress', 'completed'] as const
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'On My Way',
  en_route: 'Arrived On Site',
  on_site: 'Start Work',
  in_progress: 'Complete Job',
}
const STATUS_ICONS: Record<string, string> = {
  scheduled: '🚗',
  en_route: '📍',
  on_site: '🔧',
  in_progress: '✅',
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
  const profile = useAuth(s => s.profile)
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const pad = isTablet ? 40 : spacing.lg
  const photoColWidth = isTablet ? '19%' as any : '31%' as any
  const [uploading, setUploading] = useState(false)
  const [notesText, setNotesText] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [showMaterialPicker, setShowMaterialPicker] = useState(false)
  const [showCustomMaterial, setShowCustomMaterial] = useState(false)
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [materialName, setMaterialName] = useState('')
  const [materialQty, setMaterialQty] = useState('1')
  const [materialCost, setMaterialCost] = useState('')
  const [materialUnit, setMaterialUnit] = useState('ea')
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<Date | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)

  // ─── Fetch Job ───
  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`*, customer:customers(id, first_name, last_name, company_name, phone, email)`)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })

  // ─── Fetch Photos ───
  const { data: photos = [] } = useQuery({
    queryKey: ['photos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  // ─── Fetch Materials ───
  const { data: materials = [] } = useQuery({
    queryKey: ['materials', id],
    queryFn: async () => {
      if (!job?.project_id) return []
      const { data, error } = await supabase
        .from('project_materials')
        .select('*')
        .eq('project_id', job.project_id)
        .order('created_at', { ascending: false })
      if (error) return []
      return data ?? []
    },
    enabled: !!job?.project_id,
  })

  // ─── Fetch Time Entries ───
  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('job_id', id)
        .eq('profile_id', profile?.id)
        .order('created_at', { ascending: false })
      if (error) return []
      return data ?? []
    },
    enabled: !!profile?.id,
  })

  // ─── Fetch Existing Invoice ───
  const { data: existingInvoice } = useQuery({
    queryKey: ['invoice', 'job', id],
    queryFn: async () => {
      if (!job?.customer_id || !profile?.organization_id) return null
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, total, amount_due')
        .eq('organization_id', profile.organization_id)
        .eq('customer_id', job.customer_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: !!job?.customer_id && !!profile?.organization_id,
  })

  // ─── Status Change (uses API for SMS notifications) ───
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const updates: any = { status: newStatus }
      if (newStatus === 'in_progress') updates.actual_start = new Date().toISOString()
      if (newStatus === 'completed') updates.actual_end = new Date().toISOString()

      const { error } = await supabase.from('jobs').update(updates).eq('id', id)
      if (error) throw error

      // Try to notify customer via API (handles Twilio SMS)
      if (newStatus === 'en_route' || newStatus === 'completed') {
        try {
          const type = newStatus === 'en_route' ? 'on_the_way' : 'completed'
          await api.post(`/api/jobs/${id}/notify-customer`, { type })
        } catch {
          // SMS notification is best-effort, don't block status change
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  })

  // ─── Filtered Catalog ───
  const filteredCatalog = useMemo(() => {
    let items = MATERIALS_CATALOG
    if (selectedCategory) items = items.filter(i => i.category === selectedCategory)
    if (materialSearch.trim()) {
      const q = materialSearch.toLowerCase()
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    }
    return items
  }, [selectedCategory, materialSearch])

  // ─── Select from catalog ───
  const selectCatalogItem = (item: CatalogItem) => {
    setMaterialName(item.name)
    setMaterialCost(item.avgCost.toFixed(2))
    setMaterialUnit(item.unit)
    setMaterialQty('1')
    setShowMaterialPicker(false)
    setShowCustomMaterial(true)
  }

  // ─── Add Material ───
  const addMaterial = useMutation({
    mutationFn: async () => {
      if (!materialName.trim()) throw new Error('Name is required')
      const qty = parseFloat(materialQty) || 1
      const cost = parseFloat(materialCost) || 0
      // If job has a project, add to project_materials. Otherwise add to expenses.
      if (job?.project_id) {
        const { error } = await supabase.from('project_materials').insert({
          project_id: job.project_id,
          name: materialName.trim(),
          quantity_used: qty,
          unit_cost: cost,
          total_cost: qty * cost,
          status: 'installed',
          category: 'materials',
        })
        if (error) throw error
      } else {
        // Fallback: log as expense
        const { error } = await supabase.from('expenses').insert({
          organization_id: profile?.organization_id,
          job_id: id,
          title: materialName.trim(),
          category: 'materials',
          amount: qty * cost,
          total_amount: qty * cost,
          status: 'pending',
          is_billable: true,
          expense_date: format(new Date(), 'yyyy-MM-dd'),
          submitted_by: profile?.id,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      setMaterialName('')
      setMaterialQty('1')
      setMaterialCost('')
      setMaterialUnit('ea')
      setShowCustomMaterial(false)
      queryClient.invalidateQueries({ queryKey: ['materials', id] })
      queryClient.invalidateQueries({ queryKey: ['expenses', id] })
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  })

  // ─── Fetch Expenses (for jobs without projects) ───
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('job_id', id)
        .eq('category', 'materials')
        .order('created_at', { ascending: false })
      if (error) return []
      return data ?? []
    },
  })

  // ─── Clock In/Out ───
  const handleClockIn = () => {
    setClockedIn(true)
    setClockInTime(new Date())
  }

  const handleClockOut = async () => {
    if (!clockInTime) return
    const end = new Date()
    const hours = Math.round(((end.getTime() - clockInTime.getTime()) / 3600000) * 100) / 100

    const { error } = await supabase.from('time_entries').insert({
      organization_id: profile?.organization_id,
      job_id: id,
      profile_id: profile?.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      start_time: clockInTime.toISOString(),
      end_time: end.toISOString(),
      hours,
      hourly_rate: 0,
      total_pay: 0,
      created_by: profile?.id,
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setClockedIn(false)
      setClockInTime(null)
      queryClient.invalidateQueries({ queryKey: ['time-entries', id] })
      Alert.alert('Time Logged', `${hours} hours recorded`)
    }
  }

  // ─── Save Completion Notes ───
  const saveNotes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('jobs').update({ completion_notes: notesText }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      setShowNotes(false)
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      Alert.alert('Saved', 'Notes saved')
    },
  })

  // ─── Create Invoice ───
  const createInvoice = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: any }>('/api/invoices', {
        customer_id: job?.customer_id,
        project_id: job?.project_id,
        type: 'standard',
        due_date: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
        line_items: [
          {
            name: job?.title ?? 'Service',
            description: job?.description ?? '',
            quantity: 1,
            unit: 'job',
            unit_cost: 0,
            is_taxable: false,
          },
          ...materials.map((m: any) => ({
            name: m.name,
            quantity: m.quantity_used ?? 1,
            unit: 'ea',
            unit_cost: m.unit_cost ?? 0,
            is_taxable: true,
          })),
        ],
      })
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', 'job', id] })
      Alert.alert('Invoice Created', 'Invoice has been created and can be sent to the customer from the web portal.')
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  })

  // ─── Photo Upload ───
  const pickAndUpload = async (type: 'before' | 'after' | 'general' | 'receipt', useCamera: boolean) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to take photos. Please enable it in Settings.')
          return
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library access is needed. Please enable it in Settings.')
          return
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })

      if (result.canceled || !result.assets[0]) return

      setUploading(true)
      const asset = result.assets[0]
      const ext = asset.uri.split('.').pop() ?? 'jpg'
      const fileName = `${id}/${Date.now()}.${ext}`
      const storagePath = `photos/${fileName}`

      const response = await fetch(asset.uri)
      const blob = await response.blob()
      const arrayBuffer = await new Response(blob).arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, arrayBuffer, { contentType: `image/${ext}`, upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(storagePath)

      const tags = type === 'receipt' ? ['receipt'] : []
      const { error: dbError } = await supabase.from('photos').insert({
        organization_id: profile?.organization_id,
        job_id: id,
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        is_before: type === 'before',
        is_after: type === 'after',
        uploaded_by: profile?.id,
        taken_at: new Date().toISOString(),
        tags,
      })

      if (dbError) throw dbError
      queryClient.invalidateQueries({ queryKey: ['photos', id] })
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleAddPhoto = () => {
    const options = ['Take Photo', 'Choose from Library', 'Cancel']
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: 2 },
      (index) => {
        if (index === 2) return
        const useCamera = index === 0
        Alert.alert('Photo Type', 'What type of photo?', [
          { text: 'Before', onPress: () => pickAndUpload('before', useCamera) },
          { text: 'After', onPress: () => pickAndUpload('after', useCamera) },
          { text: 'Receipt', onPress: () => pickAndUpload('receipt', useCamera) },
          { text: 'General', onPress: () => pickAndUpload('general', useCamera) },
        ])
      }
    )
  }

  // ─── Status Advance ───
  const handleAdvanceStatus = () => {
    if (!job) return
    const currentIdx = STATUS_FLOW.indexOf(job.status)
    if (currentIdx === -1 || currentIdx >= STATUS_FLOW.length - 1) return
    const nextStatus = STATUS_FLOW[currentIdx + 1]

    if (nextStatus === 'en_route') {
      Alert.alert('On My Way', 'This will notify the customer that you are on the way.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send & Go', onPress: () => statusMutation.mutate(nextStatus) },
      ])
    } else if (nextStatus === 'completed') {
      Alert.alert('Complete Job', 'Mark this job as completed? The customer will be notified.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => statusMutation.mutate(nextStatus) },
      ])
    } else {
      statusMutation.mutate(nextStatus)
    }
  }

  const nextAction = job ? STATUS_LABELS[job.status] : null
  const nextIcon = job ? STATUS_ICONS[job.status] : null
  const customer = job?.customer as any
  const totalHours = timeEntries.reduce((sum: number, e: any) => sum + (e.hours ?? 0), 0)

  const openMaps = () => {
    if (!job?.address_line1) return
    const addr = encodeURIComponent([job.address_line1, job.city, job.state, job.zip].filter(Boolean).join(', '))
    Linking.openURL(`https://maps.apple.com/?daddr=${addr}`)
  }

  const callCustomer = () => {
    if (!customer?.phone) return
    Linking.openURL(`tel:${customer.phone}`)
  }

  const textCustomer = () => {
    if (!customer?.phone) return
    Linking.openURL(`sms:${customer.phone}`)
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
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { padding: pad, maxWidth: 900, alignSelf: 'center' as any, width: '100%' }]}>
      <Stack.Screen options={{ title: job.title, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false }} />

      {/* ─── Status Progress ─── */}
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
              <Text style={styles.actionText}>{nextIcon} {nextAction}</Text>
            )}
          </TouchableOpacity>
        )}

        {job.status === 'completed' && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>Job Completed</Text>
          </View>
        )}
      </View>

      {/* ─── Customer + Location (side-by-side on tablet) ─── */}
      <View style={isTablet ? { flexDirection: 'row', gap: spacing.sm } : undefined}>
        {customer && (
          <View style={[styles.card, isTablet && { flex: 1 }]}>
            <Text style={styles.cardLabel}>Customer</Text>
            <Text style={[styles.cardTitle, isTablet && { fontSize: fontSize.lg }]}>
              {customer.company_name ?? `${customer.first_name} ${customer.last_name}`}
            </Text>
            <View style={styles.quickActions}>
              {customer.phone && (
                <>
                  <TouchableOpacity style={[styles.quickButton, isTablet && { paddingHorizontal: 24, paddingVertical: 12 }]} onPress={callCustomer}>
                    <Text style={styles.quickButtonText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.quickButton, isTablet && { paddingHorizontal: 24, paddingVertical: 12 }]} onPress={textCustomer}>
                    <Text style={styles.quickButtonText}>Text</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {job.address_line1 && (
          <TouchableOpacity style={[styles.card, isTablet && { flex: 1 }]} onPress={openMaps} activeOpacity={0.7}>
            <Text style={styles.cardLabel}>Location</Text>
            <Text style={[styles.cardTitle, isTablet && { fontSize: fontSize.lg }]}>{job.address_line1}</Text>
            <Text style={styles.cardSub}>
              {[job.city, job.state, job.zip].filter(Boolean).join(', ')}
            </Text>
            <Text style={styles.mapLink}>Open in Maps</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Schedule ─── */}
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

      {/* ─── Instructions ─── */}
      {job.instructions && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Instructions</Text>
          <Text style={styles.instructions}>{job.instructions}</Text>
        </View>
      )}

      {/* ─── Time Tracking + Schedule (side-by-side on tablet) ─── */}
      <View style={isTablet ? { flexDirection: 'row', gap: spacing.sm } : undefined}>
      <View style={[styles.card, isTablet && { flex: 1 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardLabel}>Time Tracking</Text>
          {totalHours > 0 && <Text style={styles.totalBadge}>{totalHours.toFixed(1)}h total</Text>}
        </View>

        {clockedIn ? (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.danger }]} onPress={handleClockOut}>
            <Text style={styles.actionText}>Clock Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.success }]} onPress={handleClockIn}>
            <Text style={styles.actionText}>Clock In</Text>
          </TouchableOpacity>
        )}

        {clockedIn && clockInTime && (
          <Text style={[styles.cardSub, { marginTop: spacing.sm, textAlign: 'center' }]}>
            Clocked in since {format(clockInTime, 'h:mm a')}
          </Text>
        )}

        {timeEntries.length > 0 && (
          <View style={{ marginTop: spacing.sm }}>
            {timeEntries.slice(0, 3).map((entry: any) => (
              <View key={entry.id} style={styles.timeEntry}>
                <Text style={styles.timeEntryDate}>{format(new Date(entry.date), 'MMM d')}</Text>
                <Text style={styles.timeEntryHours}>{entry.hours}h</Text>
                {entry.start_time && entry.end_time && (
                  <Text style={styles.timeEntryRange}>
                    {format(new Date(entry.start_time), 'h:mm a')} - {format(new Date(entry.end_time), 'h:mm a')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
      </View>

      {/* ─── Materials & Parts ─── */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardLabel}>Materials & Parts</Text>
          <TouchableOpacity onPress={() => { setMaterialSearch(''); setSelectedCategory(null); setShowMaterialPicker(true) }}>
            <Text style={styles.addPhotoText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {materials.length === 0 && expenses.length === 0 && (
          <Text style={styles.cardSub}>No materials logged yet</Text>
        )}

        {materials.map((m: any) => (
          <View key={m.id} style={styles.materialRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.materialName}>{m.name}</Text>
              <Text style={styles.materialDetail}>
                Qty: {m.quantity_used ?? m.quantity_estimated ?? '-'} · ${(m.unit_cost ?? 0).toFixed(2)}/{m.unit ?? 'ea'}
              </Text>
            </View>
            <Text style={styles.materialTotal}>${(m.total_cost ?? 0).toFixed(2)}</Text>
          </View>
        ))}

        {expenses.map((e: any) => (
          <View key={e.id} style={styles.materialRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.materialName}>{e.title}</Text>
              <Text style={styles.materialDetail}>Expense · {e.status}</Text>
            </View>
            <Text style={styles.materialTotal}>${(e.total_amount ?? 0).toFixed(2)}</Text>
          </View>
        ))}

        {(materials.length > 0 || expenses.length > 0) && (
          <View style={styles.materialTotalRow}>
            <Text style={styles.materialTotalLabel}>Total Materials</Text>
            <Text style={styles.materialGrandTotal}>
              ${(
                materials.reduce((sum: number, m: any) => sum + (m.total_cost ?? 0), 0) +
                expenses.reduce((sum: number, e: any) => sum + (e.total_amount ?? 0), 0)
              ).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.materialButtons}>
          <TouchableOpacity
            style={[styles.quickButton, { flex: 1 }]}
            onPress={() => {
              ActionSheetIOS.showActionSheetWithOptions(
                { options: ['Take Photo', 'Choose from Library', 'Cancel'], cancelButtonIndex: 2 },
                (index) => {
                  if (index === 0) pickAndUpload('receipt', true)
                  if (index === 1) pickAndUpload('receipt', false)
                }
              )
            }}
          >
            <Text style={styles.quickButtonText}>Snap Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, { flex: 1 }]}
            onPress={() => {
              setMaterialName('')
              setMaterialQty('1')
              setMaterialCost('')
              setMaterialUnit('ea')
              setShowCustomMaterial(true)
            }}
          >
            <Text style={styles.quickButtonText}>Add Custom</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Photos ─── */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardLabel}>Photos ({photos.length})</Text>
          <TouchableOpacity onPress={handleAddPhoto} disabled={uploading}>
            <Text style={styles.addPhotoText}>{uploading ? 'Uploading...' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>
        {photos.length === 0 ? (
          <Text style={styles.cardSub}>No photos yet</Text>
        ) : (
          <View style={styles.photoGrid}>
            {photos.map((photo: any) => (
              <View key={photo.id} style={[styles.photoItem, { width: photoColWidth }]}>
                <Image
                  source={{ uri: photo.public_url }}
                  style={styles.photoImage}
                  contentFit="cover"
                />
                {(photo.is_before || photo.is_after || (photo.tags ?? []).includes('receipt')) && (
                  <View style={[
                    styles.photoBadge,
                    photo.is_after && { backgroundColor: colors.success + '90' },
                    (photo.tags ?? []).includes('receipt') && { backgroundColor: colors.warning + '90' },
                  ]}>
                    <Text style={styles.photoBadgeText}>
                      {photo.is_before ? 'Before' : photo.is_after ? 'After' : 'Receipt'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ─── Notes ─── */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardLabel}>Completion Notes</Text>
          <TouchableOpacity onPress={() => { setNotesText(job.completion_notes ?? ''); setShowNotes(true) }}>
            <Text style={styles.addPhotoText}>{job.completion_notes ? 'Edit' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>
        {job.completion_notes ? (
          <Text style={styles.instructions}>{job.completion_notes}</Text>
        ) : (
          <Text style={styles.cardSub}>No notes yet</Text>
        )}
      </View>

      {/* ─── Invoice ─── */}
      {job.status === 'completed' && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Invoice</Text>
          {existingInvoice ? (
            <View>
              <Text style={styles.cardTitle}>{existingInvoice.invoice_number}</Text>
              <View style={styles.invoiceRow}>
                <Text style={styles.cardSub}>
                  Status: {existingInvoice.status}
                </Text>
                <Text style={styles.invoiceTotal}>
                  ${(existingInvoice.total ?? 0).toFixed(2)}
                </Text>
              </View>
              {existingInvoice.amount_due > 0 && (
                <Text style={[styles.cardSub, { color: colors.warning }]}>
                  Amount Due: ${existingInvoice.amount_due.toFixed(2)}
                </Text>
              )}
            </View>
          ) : (
            <View>
              <Text style={styles.cardSub}>No invoice created yet</Text>
              <TouchableOpacity
                style={[styles.actionButton, { marginTop: spacing.sm, backgroundColor: colors.success }]}
                onPress={() => {
                  Alert.alert('Create Invoice', 'Create an invoice for this job?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Create', onPress: () => createInvoice.mutate() },
                  ])
                }}
                disabled={createInvoice.isPending}
              >
                {createInvoice.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.actionText}>Create Invoice</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ─── Notes Modal ─── */}
      <Modal visible={showNotes} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Completion Notes</Text>
            <TextInput
              style={styles.textArea}
              value={notesText}
              onChangeText={setNotesText}
              placeholder="Describe work completed, issues found, follow-up needed..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowNotes(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={() => saveNotes.mutate()}
                disabled={saveNotes.isPending}
              >
                <Text style={styles.modalSaveText}>
                  {saveNotes.isPending ? 'Saving...' : 'Save Notes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Material Library Picker ─── */}
      <Modal visible={showMaterialPicker} animationType="slide">
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.modalTitle}>Materials & Parts</Text>
            <TouchableOpacity onPress={() => setShowMaterialPicker(false)}>
              <Text style={styles.pickerClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            value={materialSearch}
            onChangeText={setMaterialSearch}
            placeholder="Search materials..."
            placeholderTextColor={colors.textMuted}
            autoFocus
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All</Text>
            </TouchableOpacity>
            {MATERIAL_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredCatalog}
            keyExtractor={(item, i) => `${item.name}-${i}`}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.catalogItem} onPress={() => selectCatalogItem(item)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catalogName}>{item.name}</Text>
                  <Text style={styles.catalogCategory}>{item.category} · {item.unit}</Text>
                </View>
                <Text style={styles.catalogPrice}>${item.avgCost.toFixed(2)}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.customAddButton}
                onPress={() => {
                  setShowMaterialPicker(false)
                  setMaterialName('')
                  setMaterialQty('1')
                  setMaterialCost('')
                  setMaterialUnit('ea')
                  setShowCustomMaterial(true)
                }}
              >
                <Text style={styles.customAddText}>+ Add Custom Material</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </Modal>

      {/* ─── Custom Material / Confirm Modal ─── */}
      <Modal visible={showCustomMaterial} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {materialName ? 'Confirm Material' : 'Add Custom Material'}
            </Text>
            <TextInput
              style={styles.input}
              value={materialName}
              onChangeText={setMaterialName}
              placeholder="Material name"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={materialQty}
                onChangeText={setMaterialQty}
                placeholder="Qty"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={materialCost}
                onChangeText={setMaterialCost}
                placeholder="Unit cost $"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { width: 70 }]}
                value={materialUnit}
                onChangeText={setMaterialUnit}
                placeholder="Unit"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            {materialName && materialCost ? (
              <Text style={styles.materialPreviewTotal}>
                Total: ${((parseFloat(materialQty) || 1) * (parseFloat(materialCost) || 0)).toFixed(2)}
              </Text>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCustomMaterial(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={() => addMaterial.mutate()}
                disabled={addMaterial.isPending}
              >
                <Text style={styles.modalSaveText}>
                  {addMaterial.isPending ? 'Adding...' : 'Add Material'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  loader: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  // Status
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

  // Cards
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  cardLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickButton: {
    backgroundColor: colors.primary + '20', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.md,
  },
  quickButtonText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  mapLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.sm },
  instructions: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22 },

  // Time tracking
  timeEntry: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  timeEntryDate: { fontSize: fontSize.xs, color: colors.textSecondary, width: 50 },
  timeEntryHours: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600', width: 40 },
  timeEntryRange: { fontSize: fontSize.xs, color: colors.textMuted, flex: 1 },
  totalBadge: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },

  // Materials
  materialRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  materialName: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
  materialDetail: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  materialTotal: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  materialTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, marginTop: spacing.xs, borderTopWidth: 2, borderTopColor: colors.border },
  materialTotalLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  materialGrandTotal: { fontSize: fontSize.md, color: colors.primary, fontWeight: '700' },
  materialButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  materialPreviewTotal: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', textAlign: 'right', marginBottom: spacing.sm },

  // Material Picker
  pickerContainer: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  pickerClose: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
  searchInput: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: fontSize.md, color: colors.text, marginHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  categoryScroll: { maxHeight: 44, marginBottom: spacing.sm },
  categoryContent: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  categoryChipTextActive: { color: 'white' },
  catalogItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  catalogName: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
  catalogCategory: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  catalogPrice: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  customAddButton: {
    paddingVertical: 20, alignItems: 'center',
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
  },
  customAddText: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },

  // Photos
  addPhotoText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoItem: { width: '31%' as any, aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoBadge: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: colors.primary + '90', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  photoBadgeText: { color: 'white', fontSize: 9, fontWeight: '700' },

  // Invoice
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  invoiceTotal: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, paddingBottom: 40,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  textArea: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md,
    fontSize: fontSize.md, color: colors.text, minHeight: 120,
  },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 14,
    fontSize: fontSize.md, color: colors.text, marginBottom: spacing.sm,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalCancel: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  modalCancelText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  modalSave: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderRadius: radius.lg, backgroundColor: colors.primary,
  },
  modalSaveText: { color: 'white', fontSize: fontSize.md, fontWeight: '600' },
})
