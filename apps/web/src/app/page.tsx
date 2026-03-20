import Link from 'next/link';
import { Swords, Trophy, BarChart3, Shield, Zap, Target } from 'lucide-react';

const features = [
  {
    icon: Swords,
    title: 'Ranked 1v1 Battles',
    desc: 'Compete head-to-head in real-time against similarly-skilled players.',
  },
  {
    icon: Trophy,
    title: 'Elo Rating & Tiers',
    desc: 'Climb from Bronze to Titan through a skill-based ranking system.',
  },
  {
    icon: Target,
    title: 'Skill Matchmaking',
    desc: 'Our MMR-based system ensures fair, competitive matches every time.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    desc: 'Track your progress with detailed stats and weakness analysis.',
  },
  {
    icon: Shield,
    title: 'Anti-Cheat Protection',
    desc: 'Strict integrity measures keep the competition fair and trusted.',
  },
  {
    icon: Zap,
    title: 'Season Ladders',
    desc: 'Compete in seasonal divisions with exclusive rewards and prestige.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 border-b border-[var(--color-border)] bg-[var(--color-bg)]/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="text-lg font-bold tracking-tight">MockGame</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-[0_0_20px_var(--color-primary-glow)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-xs font-semibold mb-6 animate-fade-in">
            <Zap size={12} />
            Now in Alpha
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6 animate-fade-in">
            Exam Prep,{' '}
            <span className="gradient-text">Reimagined</span>
            <br />
            as Competition
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto mb-10 animate-fade-in">
            Stop studying alone. Battle real opponents in ranked 1v1 matches, climb the tier ladder,
            and sharpen your skills through competitive pressure.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in">
            <Link
              href="/register"
              className="px-8 py-3.5 text-base font-semibold rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-[0_0_30px_var(--color-primary-glow)] hover:shadow-[0_0_50px_var(--color-primary-glow)]"
            >
              Start Competing
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 text-base font-semibold rounded-[var(--radius-lg)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Grid accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,var(--color-primary-glow),transparent_70%)] pointer-events-none opacity-40" />

      {/* Features */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Built for <span className="gradient-text">Serious Aspirants</span>
          </h2>
          <p className="text-center text-[var(--color-text-muted)] mb-14 max-w-xl mx-auto">
            Every feature is designed to push your preparation forward through competitive intensity and measurable progress.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40 transition-all duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors duration-300">
                  <f.icon size={20} className="text-[var(--color-primary)] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-base font-bold mb-1.5">{f.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam tracks */}
      <section className="py-20 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Target Exam Tracks</h2>
          <p className="text-[var(--color-text-muted)] mb-10">
            Practice competitive battles focused on these high-stakes exams.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {['JEE Main', 'JEE Advanced', 'BITSAT'].map((exam) => (
              <div
                key={exam}
                className="px-8 py-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-semibold hover:border-[var(--color-primary)]/40 transition-colors"
              >
                {exam}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-faint)]">
            &copy; 2026 MockGame. All rights reserved.
          </p>
          <p className="text-sm text-[var(--color-text-faint)]">Alpha Release</p>
        </div>
      </footer>
    </div>
  );
}
