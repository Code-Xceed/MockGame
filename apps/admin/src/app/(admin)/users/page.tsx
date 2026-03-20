'use client';

import { UserPlus } from 'lucide-react';
import { useAdminUsers } from '@/lib/hooks/use-admin-data';

export default function UsersPage() {
  const { data, loading } = useAdminUsers();
  const users = data?.data ?? [];

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <p>View, edit, and moderate user accounts</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>All Users</h2>
          <button className="btn btn-ghost">
            <UserPlus size={14} />
            Add User
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Exam Track</th>
              <th>MMR</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">No users found.</div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.displayName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge badge-primary">{user.role}</span>
                  </td>
                  <td>{user.examTrack}</td>
                  <td>{user.ratings[0]?.hiddenMmr ?? '-'}</td>
                  <td>
                    <button className="btn btn-ghost">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
