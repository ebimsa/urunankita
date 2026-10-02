export interface User {
  id: string
  fullName: string
  email?: string | null
  phone: string
  avatarUrl?: string | null
  createdAt?: string
}

export interface AuthResponse {
  message: string
  accessToken: string
  user: User
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:3001'

  const token = useCookie<string | null>('urunankita_jwt_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: '/',
    sameSite: 'lax',
  })

  const user = useState<User | null>('urunankita_auth_user', () => null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  const extractErrorMessage = (err: any): string => {
    if (err?.data?.message) {
      if (Array.isArray(err.data.message)) {
        return err.data.message.join(', ')
      }
      return String(err.data.message)
    }
    if (err?.message) {
      return String(err.message)
    }
    return 'Terjadi kendala pada server. Silakan coba kembali.'
  }

  const fetchMe = async (): Promise<User | null> => {
    if (!token.value) {
      user.value = null
      return null
    }

    try {
      const data = await $fetch<User>(`${apiBase}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
      user.value = data
      return data
    } catch (err: any) {
      // Jika token expired / invalid, reset auth
      if (err?.status === 401 || err?.statusCode === 401) {
        token.value = null
        user.value = null
      }
      return null
    }
  }

  const login = async (identifier: string, password: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const res = await $fetch<AuthResponse>(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { identifier: identifier.trim(), password },
      })

      token.value = res.accessToken
      user.value = res.user
      return true
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      return false
    } finally {
      loading.value = false
    }
  }

  const register = async (
    fullName: string,
    phone: string,
    password: string,
    email?: string,
  ): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const payload: Record<string, string> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
      }
      if (email && email.trim()) {
        payload.email = email.trim()
      }

      const res = await $fetch<AuthResponse>(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      token.value = res.accessToken
      user.value = res.user
      return true
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    error.value = null
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    fetchMe,
    logout,
  }
}
