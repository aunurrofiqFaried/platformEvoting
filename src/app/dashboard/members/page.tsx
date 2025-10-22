'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MemberTable } from '@/components/dashboard/member-table'
import { StatsCard } from '@/components/dashboard/stat-card'
import { Input } from '@/components/ui/input'
// import { Button } from '@/components/ui/button'
import { Users, UserPlus, Search, Loader2, Shield } from 'lucide-react'
// import { useToast } from '@/components/ui/use-toast'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Member {
  id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  // const { toast } = useToast()

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    // Filter members based on search query
    if (searchQuery.trim()) {
      const filtered = members.filter(member =>
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredMembers(filtered)
    } else {
      setFilteredMembers(members)
    }
  }, [searchQuery, members])

  const loadMembers = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setMembers(data || [])
      setFilteredMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (member: Member, newRole: 'admin' | 'member'): Promise<void> => {
    if (!confirm(`Are you sure you want to change ${member.email}'s role to ${newRole}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', member.id)

      if (error) throw error

      // Update local state
      setMembers(members.map(m =>
        m.id === member.id ? { ...m, role: newRole } : m
      ))

      toast.success(`Role updated to ${newRole} for ${member.email}`)
    } catch (error) {
      console.error('Error changing role:', error)
      toast.error('Failed to change member role')
    }
  }

  const handleDeleteMember = async (member: Member): Promise<void> => {
    if (!confirm(`Are you sure you want to delete ${member.email}? This will also delete all their voting rooms.`)) {
      return
    }

    const doubleConfirm = prompt(`Type "${member.email}" to confirm deletion`)
    if (doubleConfirm !== member.email) {
      toast.warning('Member deletion cancelled')
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', member.id)

      if (error) throw error

      // Update local state
      setMembers(members.filter(m => m.id !== member.id))

      toast.success(`Member ${member.email} deleted successfully`)
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error('Failed to delete member')
    }
  }

  // Calculate stats
  const totalMembers = members.length
  const adminCount = members.filter(m => m.role === 'admin').length
  const memberCount = members.filter(m => m.role === 'member').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Members Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage all members and their roles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Members"
          value={totalMembers}
          icon={Users}
          description="All registered users"
          color="blue"
        />
        <StatsCard
          title="Admins"
          value={adminCount}
          icon={Shield}
          description="Administrator accounts"
          color="orange"
        />
        <StatsCard
          title="Regular Members"
          value={memberCount}
          icon={UserPlus}
          description="Standard user accounts"
          color="green"
        />
      </div>

      {/* Members Table Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">All Members</CardTitle>
              <CardDescription>View and manage all registered members</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <MemberTable
              members={filteredMembers}
              onChangeRole={handleChangeRole}
              onDelete={handleDeleteMember}
              currentUserId={currentUserId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}