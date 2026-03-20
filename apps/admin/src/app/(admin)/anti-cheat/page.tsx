'use client';

import { useAntiCheatFlags } from '@/lib/hooks/use-admin-data';

export default function AntiCheatPage() {
  const { data, loading } = useAntiCheatFlags();
  const flags = data?.data ?? [];

  return (
    <div>
      <div className="page-header">
        <h1>Anti-Cheat Flags</h1>
        <p>Review suspicious sessions and match patterns.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Flags Loaded</div>
          <div className="value">{loading ? '...' : flags.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">High Severity</div>
          <div className="value">
            {loading ? '...' : flags.filter((flag) => flag.severity === 'HIGH').length}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Recent Flags</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Severity</th>
              <th>Type</th>
              <th>User</th>
              <th>Match</th>
              <th>Track</th>
            </tr>
          </thead>
          <tbody>
            {!loading && flags.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">No anti-cheat flags found.</div>
                </td>
              </tr>
            ) : (
              flags.map((flag) => (
                <tr key={flag.id}>
                  <td>{new Date(flag.createdAt).toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        flag.severity === 'HIGH'
                          ? 'badge-danger'
                          : flag.severity === 'MEDIUM'
                            ? 'badge-warning'
                            : 'badge-primary'
                      }`}
                    >
                      {flag.severity}
                    </span>
                  </td>
                  <td>{flag.type}</td>
                  <td>{flag.user?.displayName ?? '-'}</td>
                  <td>{flag.match.id.slice(0, 10)}...</td>
                  <td>{flag.match.examTrack}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
