import { create } from 'zustand'

const savedUser = localStorage.getItem('authUser')
const savedToken = localStorage.getItem('authToken')

export const useAuthStore = create((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  setSession: ({ user, token }) => {
    localStorage.setItem('authUser', JSON.stringify(user))
    localStorage.setItem('authToken', token)
    if (user?.role === 'super_admin') {
      localStorage.setItem('adminToken', token)
    }
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('authUser')
    localStorage.removeItem('authToken')
    localStorage.removeItem('adminToken')
    set({ user: null, token: null })
  },
}))
