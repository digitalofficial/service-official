'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#84cc16']

interface Props {
  monthlyRevenue: { month: string; revenue: number; expenses: number }[]
  monthlyJobs: { month: string; completed: number }[]
  expenseByCategory: { name: string; value: number }[]
  topCustomers: { name: string; revenue: number }[]
  totalExpenses: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          {entry.name}: {typeof entry.value === 'number' && entry.value > 100 ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

export function ReportsCharts({ monthlyRevenue, monthlyJobs, expenseByCategory, topCustomers, totalExpenses }: Props) {
  return (
    <div className="space-y-6">
      {/* Revenue Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Monthly Revenue</h3>
        <p className="text-xs text-gray-500 mb-4">Last 12 months</p>
        <div className="h-52 sm:h-64 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue vs Expenses Line */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Revenue vs Expenses</h3>
        <p className="text-xs text-gray-500 mb-4">Monthly comparison</p>
        <div className="h-52 sm:h-64 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Pie + Jobs - stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Expense Breakdown</h3>
          <p className="text-xs text-gray-500 mb-4">By category</p>
          {expenseByCategory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No expense data</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-44 w-44 sm:h-48 sm:w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={70}
                      paddingAngle={2} dataKey="value"
                    >
                      {expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-1.5">
                {expenseByCategory.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-700 capitalize truncate">{cat.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 shrink-0 ml-2">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Jobs Completed */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Jobs Completed</h3>
          <p className="text-xs text-gray-500 mb-4">Per month</p>
          <div className="h-52 sm:h-64 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyJobs} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Top Customers by Revenue</h3>
        <p className="text-xs text-gray-500 mb-4">All time</p>
        {topCustomers.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No customer revenue data yet</div>
        ) : (
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
