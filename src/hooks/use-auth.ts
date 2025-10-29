import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token dari localStorage
        const storedToken = localStorage.getItem('authToken')
        const userId = localStorage.getItem('userId')
        const userEmail = localStorage.getItem('userEmail')

        if (!storedToken || !userId || !userEmail) {
          setLoading(false)
          return
        }

        setToken(storedToken)

        // Bisa set user dari localStorage juga, atau fetch dari API
        setUser({
          id: userId,
          email: userEmail,
          full_name: localStorage.getItem('userName') || userEmail.split('@')[0],
          role: localStorage.getItem('userRole') || 'member',
        })

        setLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('userRole')
    setUser(null)
    setToken(null)
    router.push('/auth/login')
  }

  return {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    logout,
  }
}