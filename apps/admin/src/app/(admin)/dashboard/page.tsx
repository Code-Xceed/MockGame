'use client';

import { Users, Swords, FileQuestion, TrendingUp } from 'lucide-react';
import { useAdminStats } from '@/lib/hooks/use-admin-data';

export default function AdminDashboard() {
  const { data, loading } = useAdminStats();

  const usersTotal = data?.users.total ?? 0;
  const matchesTotal = data?.matches.total ?? 0;
  const questionsTotal = data?.questions.total ?? 0;
  const highSeverityFlags = data?.antiCheat.highSeverity ?? 0;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Platform overview and key metrics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Users</div>
          <div className="value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} style={{ color: 'var(--primary)' }} />
            <span>{loading ? '...' : usersTotal}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Total Matches</div>
          <div className="value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Swords size={20} style={{ color: 'var(--warning)' }} />
            <span>{loading ? '...' : matchesTotal}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Questions</div>
          <div className="value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileQuestion size={20} style={{ color: 'var(--success)' }} />
            <span>{loading ? '...' : questionsTotal}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">High Severity Flags</div>
          <div className="value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} style={{ color: 'var(--danger)' }} />
            <span>{loading ? '...' : highSeverityFlags}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Recent Activity</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Active matches</td>
              <td>{loading ? '...' : data?.matches.active ?? 0}</td>
            </tr>
            <tr>
              <td>Completed matches</td>
              <td>{loading ? '...' : data?.matches.completed ?? 0}</td>
            </tr>
            <tr>
              <td>Cancelled matches</td>
              <td>{loading ? '...' : data?.matches.cancelled ?? 0}</td>
            </tr>
            <tr>
              <td>Active questions</td>
              <td>{loading ? '...' : data?.questions.active ?? 0}</td>
            </tr>
            <tr>
              <td>Unresolved anti-cheat flags</td>
              <td>{loading ? '...' : data?.antiCheat.unresolved ?? 0}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
