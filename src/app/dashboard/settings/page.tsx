'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
// import { DashboardLayout } from '@/components/dashboard/layout'
import { SettingsSection } from '@/components/dashboard/settings-section'
import { SettingsItem } from '@/components/dashboard/settings-item'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, Shield, Bell, Moon, Sun } from 'lucide-react'
// import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface User {
  id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true)
  const [voteNotifications, setVoteNotifications] = useState<boolean>(true)
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  const router = useRouter()
  // const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const checkUser = async (): Promise<void> => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userData) {
        router.push('/auth/login')
        return
      }

      setUser(userData)
      setLoading(false)
    }

    checkUser()
  }, [router])

  const handlePasswordChange = async (): Promise<void> => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password filds')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setNewPassword('')
      setConfirmPassword('')

      toast.success('Password Updated Successfully')
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async (): Promise<void> => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your voting rooms will be deleted.'
    )

    if (!confirmed) return

    const doubleConfirm = prompt('Type "DELETE" to confirm account deletion')

    if (doubleConfirm !== 'DELETE') {
      toast.error('Account deletion cancelled')
      return
    }

    try {
      // Delete user from public.users (cascade will delete rooms)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user!.id)

      if (error) throw error

      // Sign out
      await supabase.auth.signOut()
      
      toast.warning('Account deleted successfully')

      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!user) return null

  const accountCreatedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    // <DashboardLayout
    //   userRole={user.role}
    //   userName={user.email?.split('@')[0] || 'User'}
    //   userEmail={user.email || ''}
    // >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Section */}
        <SettingsSection
          title="Profile Information"
          description="View and manage your profile information"
        >
          <SettingsItem
            label="Email Address"
            description="This is your account email address"
            htmlFor="email"
          >
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
              <Badge variant="secondary" className="shrink-0">
                Verified
              </Badge>
            </div>
          </SettingsItem>

          <SettingsItem
            label="Account Role"
            description="Your current role in the system"
          >
            <Badge 
              className="w-fit capitalize"
              variant={user.role === 'admin' ? 'default' : 'secondary'}
            >
              {user.role}
            </Badge>
          </SettingsItem>

          <SettingsItem
            label="Member Since"
            description="The date you created your account"
          >
            <p className="text-sm text-slate-900 dark:text-white font-medium">
              {accountCreatedDate}
            </p>
          </SettingsItem>
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection
          title="Security"
          description="Manage your password and security settings"
        >
          <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
            <Shield className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              Choose a strong password to keep your account secure
            </AlertDescription>
          </Alert>

          <SettingsItem
            label="New Password"
            description="Must be at least 6 characters"
            htmlFor="new-password"
          >
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={saving}
            />
          </SettingsItem>

          <SettingsItem
            label="Confirm New Password"
            description="Re-enter your new password"
            htmlFor="confirm-password"
          >
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={saving}
            />
          </SettingsItem>

          <Button
            onClick={handlePasswordChange}
            disabled={saving || !newPassword || !confirmPassword}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? 'Updating...' : 'Update Password'}
          </Button>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection
          title="Appearance"
          description="Customize how the app looks for you"
        >
          <SettingsItem
            label="Theme"
            description="Choose your preferred color theme"
          >
            <div className="flex items-center gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="gap-2"
              >
                <Sun className="w-4 h-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="gap-2"
              >
                <Moon className="w-4 h-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                System
              </Button>
            </div>
          </SettingsItem>
        </SettingsSection>

        {/* Notifications Section */}
        {/* <SettingsSection
          title="Notifications"
          description="Manage how you receive notifications"
        >
          <SettingsItem
            label="Email Notifications"
            description="Receive updates and news via email"
          >
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm text-slate-900 dark:text-white">
                  General Updates
                </span>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </SettingsItem>

          <SettingsItem
            label="Vote Notifications"
            description="Get notified when someone votes in your rooms"
          >
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm text-slate-900 dark:text-white">
                  New Votes
                </span>
              </div>
              <Switch
                checked={voteNotifications}
                onCheckedChange={setVoteNotifications}
              />
            </div>
          </SettingsItem>
        </SettingsSection> */}

        {/* Danger Zone */}
        <SettingsSection
          title="Danger Zone"
          description="Irreversible actions for your account"
        >
          <Alert variant="destructive" className="border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Once you delete your account, there is no going back. All your voting rooms and data will be permanently deleted.
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Delete Account
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permanently delete your account and all associated data
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="mt-2"
            >
              Delete Account
            </Button>
          </div>
        </SettingsSection>
      </div>
    // </DashboardLayout>
  )
}