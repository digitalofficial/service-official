import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/stores/auth'
import { colors, spacing, radius, fontSize } from '@/lib/theme'

export default function LoginScreen() {
  const signIn = useAuth(s => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { width } = useWindowDimensions()
  const isTablet = width >= 768

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      router.replace('/(app)/(tabs)')
    } catch (err: any) {
      setError(err.message ?? 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{
        paddingHorizontal: spacing.xl,
        maxWidth: isTablet ? 480 : undefined,
        alignSelf: 'center',
        width: '100%',
      }}>
        <View style={{
          width: isTablet ? 100 : 72,
          height: isTablet ? 100 : 72,
          borderRadius: radius.xl,
          backgroundColor: colors.primaryDark,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          marginBottom: spacing.lg,
        }}>
          <Text style={{ fontSize: isTablet ? 48 : 36 }}>🛡️</Text>
        </View>
        <Text style={{
          fontSize: isTablet ? 38 : fontSize.xxl,
          fontWeight: '800',
          color: colors.text,
          textAlign: 'center',
        }}>Service Official</Text>
        <Text style={{
          fontSize: isTablet ? fontSize.md : fontSize.sm,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: spacing.xs,
          marginBottom: spacing.xl,
        }}>Sign in to your account</Text>

        {error ? (
          <Text style={{ color: colors.danger, fontSize: isTablet ? fontSize.md : fontSize.sm, textAlign: 'center', marginBottom: spacing.md }}>
            {error}
          </Text>
        ) : null}

        <TextInput
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            paddingHorizontal: isTablet ? spacing.lg : spacing.md,
            paddingVertical: isTablet ? 18 : 14,
            fontSize: isTablet ? fontSize.lg : fontSize.md,
            color: colors.text,
            marginBottom: spacing.md,
          }}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            paddingHorizontal: isTablet ? spacing.lg : spacing.md,
            paddingVertical: isTablet ? 18 : 14,
            fontSize: isTablet ? fontSize.lg : fontSize.md,
            color: colors.text,
            marginBottom: spacing.md,
          }}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.lg,
            paddingVertical: isTablet ? 20 : 16,
            alignItems: 'center',
            marginTop: spacing.sm,
            opacity: loading ? 0.6 : 1,
          }}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ color: 'white', fontSize: isTablet ? fontSize.lg : fontSize.md, fontWeight: '600' }}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
