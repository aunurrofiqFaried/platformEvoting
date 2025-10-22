'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical, Mail, Shield, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Member {
  id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
}

interface MemberTableProps {
  members: Member[]
  onChangeRole?: (member: Member, newRole: 'admin' | 'member') => void
  onDelete?: (member: Member) => void
  currentUserId: string
}

export function MemberTable({ members, onChangeRole, onDelete, currentUserId }: MemberTableProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900">
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Role</TableHead>
            <TableHead className="font-semibold">Joined Date</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-slate-500 dark:text-slate-400">
                No members found
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
              const isCurrentUser = member.id === currentUserId

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {member.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {member.email}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            (You)
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.role === 'admin' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {formatDate(member.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isCurrentUser}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            window.location.href = `mailto:${member.email}`
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        {onChangeRole && (
                          <DropdownMenuItem
                            onClick={() => {
                              const newRole = member.role === 'admin' ? 'member' : 'admin'
                              onChangeRole(member, newRole)
                            }}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Change to {member.role === 'admin' ? 'Member' : 'Admin'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(member)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Member
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}