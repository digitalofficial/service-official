import { useState, useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { colors, spacing, radius, fontSize } from '@/lib/theme'

interface TeamMessage {
  id: string
  sender_id: string
  recipient_id: string | null
  body: string
  is_read: boolean
  created_at: string
  sender?: { id: string; first_name: string; last_name: string; role: string }
  recipient?: { id: string; first_name: string; last_name: string; role: string } | null
}

export default function MessagesScreen() {
  const profile = useAuth(s => s.profile)
  const session = useAuth(s => s.session)
  const queryClient = useQueryClient()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const [newMessage, setNewMessage] = useState('')
  const flatListRef = useRef<FlatList>(null)

  const { data: messages = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['team-messages'],
    queryFn: async () => {
      if (!profile?.organization_id) return []
      const { data, error } = await supabase
        .from('team_messages')
        .select(`
          *,
          sender:profiles!sender_id(id, first_name, last_name, role),
          recipient:profiles!recipient_id(id, first_name, last_name, role)
        `)
        .eq('organization_id', profile.organization_id)
        .or(`recipient_id.eq.${profile.id},recipient_id.is.null,sender_id.eq.${profile.id}`)
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.organization_id,
    refetchInterval: 10000,
  })

  // Mark messages as read
  useEffect(() => {
    if (!profile?.id || messages.length === 0) return
    const unread = messages.filter(
      (m: TeamMessage) => !m.is_read && m.sender_id !== profile.id && (m.recipient_id === profile.id || m.recipient_id === null)
    )
    if (unread.length > 0) {
      supabase
        .from('team_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unread.map((m: TeamMessage) => m.id))
        .then(() => {})
    }
  }, [messages, profile?.id])

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim() || !profile) return
      const { error } = await supabase.from('team_messages').insert({
        organization_id: profile.organization_id,
        sender_id: profile.id,
        recipient_id: null, // broadcast
        body: newMessage.trim(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['team-messages'] })
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200)
    },
  })

  const getSenderName = (msg: TeamMessage) => {
    if (msg.sender_id === profile?.id) return 'You'
    return msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Unknown'
  }

  const isMe = (msg: TeamMessage) => msg.sender_id === profile?.id

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? (isTablet ? 100 : 88) : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item: TeamMessage) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={{
          padding: isTablet ? 40 : spacing.lg,
          paddingBottom: 20,
          maxWidth: 800,
          alignSelf: 'center' as any,
          width: '100%',
          flexGrow: 1,
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>💬</Text>
            <Text style={{ color: colors.text, fontSize: isTablet ? fontSize.lg : fontSize.md, fontWeight: '600' }}>
              {isLoading ? 'Loading...' : 'Team Messages'}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: isTablet ? fontSize.md : fontSize.sm, marginTop: spacing.xs, textAlign: 'center' }}>
              {isLoading ? '' : 'Messages from your team will appear here.\nSend a message to get started.'}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: TeamMessage }) => {
          const mine = isMe(item)
          const senderName = getSenderName(item)
          const isBroadcast = item.recipient_id === null

          return (
            <View style={{
              alignItems: mine ? 'flex-end' : 'flex-start',
              marginBottom: spacing.sm,
            }}>
              <View style={{
                maxWidth: '80%',
                backgroundColor: mine ? colors.primary : colors.card,
                borderRadius: 18,
                borderBottomRightRadius: mine ? 6 : 18,
                borderBottomLeftRadius: mine ? 18 : 6,
                paddingHorizontal: isTablet ? 18 : 14,
                paddingVertical: isTablet ? 12 : 10,
                borderWidth: mine ? 0 : 1,
                borderColor: colors.border,
              }}>
                {!mine && (
                  <Text style={{
                    fontSize: isTablet ? fontSize.xs + 1 : fontSize.xs,
                    fontWeight: '700',
                    color: colors.primary,
                    marginBottom: 2,
                  }}>
                    {senderName}
                    {isBroadcast && (
                      <Text style={{ color: colors.textMuted, fontWeight: '400' }}> · Broadcast</Text>
                    )}
                  </Text>
                )}
                <Text style={{
                  fontSize: isTablet ? fontSize.md : fontSize.sm,
                  color: mine ? 'white' : colors.text,
                  lineHeight: isTablet ? 24 : 20,
                }}>
                  {item.body}
                </Text>
                <Text style={{
                  fontSize: isTablet ? 11 : 10,
                  color: mine ? 'rgba(255,255,255,0.6)' : colors.textMuted,
                  marginTop: 4,
                  textAlign: mine ? 'right' : 'left',
                }}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
              </View>
            </View>
          )
        }}
      />

      {/* Input Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
        paddingHorizontal: isTablet ? 40 : spacing.lg,
        paddingVertical: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? (isTablet ? 30 : 24) : spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
        maxWidth: 800,
        alignSelf: 'center' as any,
        width: '100%',
      }}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Message your team..."
          placeholderTextColor={colors.textMuted}
          multiline
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            paddingHorizontal: isTablet ? 20 : 16,
            paddingVertical: isTablet ? 14 : 10,
            fontSize: isTablet ? fontSize.md : fontSize.sm,
            color: colors.text,
            maxHeight: 100,
          }}
        />
        <TouchableOpacity
          onPress={() => sendMutation.mutate()}
          disabled={!newMessage.trim() || sendMutation.isPending}
          style={{
            width: isTablet ? 52 : 44,
            height: isTablet ? 52 : 44,
            borderRadius: isTablet ? 26 : 22,
            backgroundColor: newMessage.trim() ? colors.primary : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: isTablet ? 20 : 18 }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
