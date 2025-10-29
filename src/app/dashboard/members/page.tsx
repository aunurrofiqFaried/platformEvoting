'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MemberTable } from '@/components/dashboard/member-table'
import { StatsCard } from '@/components/dashboard/stat-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// import { Button } from '@/components/ui/button'
import { Users, UserPlus, Search, Loader2, Shield, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
// import { useToast } from '@/components/ui/use-toast'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Member {
  id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
}

const ITEMS_PER_PAGE = 10

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  // const { toast } = useToast()

  useEffect(() => {
    checkAuthAndLoadMembers()
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
    // Reset to page 1 when search changes
    setCurrentPage(1)
  }, [searchQuery, members])

  const checkAuthAndLoadMembers = async (): Promise<void> => {
    try {
      setError(null)
      
      // Small delay untuk ensure localStorage ready
      await new Promise(resolve => setTimeout(resolve, 50))

      // Check localStorage dulu
      let currentId = localStorage.getItem('userId')
      let role = localStorage.getItem('userRole') as 'admin' | 'member' | null

      console.log('Members page auth check:', { hasAuth: !!currentId, role })

      // Fallback ke Supabase Auth
      if (!currentId || !role) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('No user found')
          router.push('/auth/login')
          return
        }

        currentId = user.id
        setCurrentUserId(user.id)

        // Get role dari database
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData) {
          role = userData.role
          setUserRole(userData.role)
        }
      } else {
        setCurrentUserId(currentId)
        setUserRole(role)
      }

      // Check if admin
      if (role !== 'admin') {
        setError('You do not have permission to access this page')
        router.push('/dashboard')
        return
      }

      // Load members
      await loadMembers(currentId)

    } catch (error) {
      console.error('Auth check error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Authentication failed'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async (adminId: string): Promise<void> => {
    try {
      console.log('Loading members as admin:', adminId)

      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Members query error:', error)
        throw new Error(`Failed to load members: ${error.message}`)
      }

      console.log('Members loaded:', data?.length)
      setMembers(data || [])
      setFilteredMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to load members'
      setError(errorMsg)
      toast.error(errorMsg)
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
    if (member.id === currentUserId) {
      toast.error('You cannot delete your own account')
      return
    }

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

  // Calculate pagination
  const totalMembers = members.length
  const filteredTotal = filteredMembers.length
  const totalPages = Math.ceil(filteredTotal / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex)

  // Calculate stats
  const adminCount = members.filter(m => m.role === 'admin').length
  const memberCount = members.filter(m => m.role === 'member').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Members Management
        </h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

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
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl dark:text-white">All Members</CardTitle>
              <CardDescription>
                {searchQuery 
                  ? `Found ${filteredTotal} member${filteredTotal !== 1 ? 's' : ''} matching your search` 
                  : `Showing ${Math.min(startIndex + 1, filteredTotal)}-${Math.min(endIndex, filteredTotal)} of ${filteredTotal} members`
                }
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                {searchQuery ? 'No members found matching your search' : 'No members found'}
              </p>
            </div>
          ) : (
            <>
              <MemberTable
                members={paginatedMembers}
                onChangeRole={handleChangeRole}
                onDelete={handleDeleteMember}
                currentUserId={currentUserId}
              />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="gap-2 dark:border-slate-600 dark:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className={
                            currentPage === page
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'dark:border-slate-600 dark:text-white dark:hover:bg-slate-800'
                          }
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="gap-2 dark:border-slate-600 dark:text-white"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {ITEMS_PER_PAGE} per page
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}