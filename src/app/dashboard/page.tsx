'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stat-card'
import { Users, Vote, BarChart3, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Welcome back! Heres whats happening today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Members"
          value="5"
          icon={Users}
          description="Total active members"
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Rooms"
          value="6"
          icon={Vote}
          description="Currently running"
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Avg Members/Room"
          value="1"
          icon={BarChart3}
          description="Average participation"
          color="orange"
          trend={{ value: 3, isPositive: false }}
        />
        <StatsCard
          title="Total Violations"
          value="8"
          icon={AlertTriangle}
          description="Issues reported"
          color="red"
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members per Room Chart */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Members per Room</CardTitle>
            <CardDescription>Distribution of members across voting rooms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
              Chart will be here (use recharts library)
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Gender Distribution</CardTitle>
            <CardDescription>Member demographics overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
              Pie chart will be here
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest voting room activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Vote className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    New vote in Room {item}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    2 hours ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}