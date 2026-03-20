'use client';

import { Plus } from 'lucide-react';
import { useAdminQuestions } from '@/lib/hooks/use-admin-data';

export default function QuestionsPage() {
  const { data, loading } = useAdminQuestions();
  const questions = data?.data ?? [];

  const total = questions.length;
  const physics = questions.filter((q) => q.subject === 'PHYSICS').length;
  const chemistry = questions.filter((q) => q.subject === 'CHEMISTRY').length;
  const mathematics = questions.filter((q) => q.subject === 'MATHEMATICS').length;

  return (
    <div>
      <div className="page-header">
        <h1>Question Bank</h1>
        <p>Manage questions for competitive battles</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Questions</div>
          <div className="value">{loading ? '...' : total}</div>
        </div>
        <div className="stat-card">
          <div className="label">Physics</div>
          <div className="value">{loading ? '...' : physics}</div>
        </div>
        <div className="stat-card">
          <div className="label">Chemistry</div>
          <div className="value">{loading ? '...' : chemistry}</div>
        </div>
        <div className="stat-card">
          <div className="label">Mathematics</div>
          <div className="value">{loading ? '...' : mathematics}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Questions</h2>
          <button className="btn btn-primary">
            <Plus size={14} />
            Add Question
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Track</th>
              <th>Question</th>
              <th>Answer</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && questions.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">No questions found.</div>
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.subject}</td>
                  <td>{q.difficulty}</td>
                  <td>{q.examTrack}</td>
                  <td>{q.body.slice(0, 56)}...</td>
                  <td>{q.correctOption}</td>
                  <td>
                    <span className={`badge ${q.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {q.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
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
