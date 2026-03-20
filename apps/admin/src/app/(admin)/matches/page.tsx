'use client';

import { useAdminMatches, type AdminMatch } from '@/lib/hooks/use-admin-data';

function scoreText(match: AdminMatch) {
  if (match.playerAScore === null || match.playerBScore === null) return '-';
  return `${match.playerAScore} - ${match.playerBScore}`;
}

export default function MatchesPage() {
  const { data, loading } = useAdminMatches();
  const matches = data?.data ?? [];

  const active = matches.filter((m) => m.status === 'ACTIVE').length;
  const completed = matches.filter((m) => m.status === 'COMPLETED').length;
  const cancelled = matches.filter((m) => m.status === 'CANCELLED').length;

  return (
    <div>
      <div className="page-header">
        <h1>Match Management</h1>
        <p>Monitor active and completed matches</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Active Matches</div>
          <div className="value">{loading ? '...' : active}</div>
        </div>
        <div className="stat-card">
          <div className="label">Completed Today</div>
          <div className="value">{loading ? '...' : completed}</div>
        </div>
        <div className="stat-card">
          <div className="label">Cancelled</div>
          <div className="value">{loading ? '...' : cancelled}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Recent Matches</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Match ID</th>
              <th>Track</th>
              <th>Player A</th>
              <th>Player B</th>
              <th>Status</th>
              <th>Score</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {!loading && matches.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">No matches found.</div>
                </td>
              </tr>
            ) : (
              matches.map((match) => (
                <tr key={match.id}>
                  <td>{match.id.slice(0, 10)}...</td>
                  <td>{match.examTrack}</td>
                  <td>{match.playerA.displayName}</td>
                  <td>{match.playerB.displayName}</td>
                  <td>
                    <span className="badge badge-primary">{match.status}</span>
                  </td>
                  <td>{scoreText(match)}</td>
                  <td>{new Date(match.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
