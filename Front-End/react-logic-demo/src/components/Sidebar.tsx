import { Award, BarChart3, Bell, BookOpen, CalendarDays, GraduationCap, Grid2X2, LogOut, MessageCircle, Search, TrendingUp } from "lucide-react";
import { StudentProfile } from "../services/api";

interface SidebarProps {
  activeView: string;
  onChangeView: (view: string) => void;
  studentName: string;
  onLogout: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Grid2X2 },
  { id: "contents", label: "Conteúdos", icon: BookOpen },
  { id: "exercises", label: "Atividades", icon: CalendarDays },
  { id: "quiz", label: "Quiz", icon: Award },
  { id: "evolution", label: "Meu Desempenho", icon: BarChart3 },
  { id: "report", label: "Tutor IA", icon: MessageCircle }
];

export const Sidebar = ({ activeView, onChangeView, studentName, onLogout }: SidebarProps) => (
  <aside className="hidden min-h-screen w-[340px] shrink-0 border-r border-line bg-white/70 lg:block">
    <div className="flex h-20 items-center gap-3 border-b border-line px-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-soft">
        <GraduationCap size={27} />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none text-ink">Adapta</div>
        <div className="mt-1 text-sm tracking-[0.18em] text-muted">LEARN · IA</div>
      </div>
    </div>

    <nav className="space-y-2 px-3 py-8">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.id === activeView;
        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`flex h-14 w-full items-center gap-4 rounded-[8px] px-5 text-left text-lg transition ${
              active ? "bg-indigo-50 text-indigo-800 shadow-soft" : "text-muted hover:bg-slate-50"
            }`}
          >
            <Icon size={22} />
            {item.label}
          </button>
        );
      })}
    </nav>

    {/* INTEGRAÇÃO (4.2): aluno logado real + logout */}
    <div className="mx-3 mt-auto border-t border-line px-2 py-6">
      <div className="px-3 text-sm text-muted">Conectado como</div>
      <div className="px-3 font-bold text-ink">{studentName}</div>
      <button
        onClick={onLogout}
        className="mt-3 flex h-11 w-full items-center gap-3 rounded-[8px] px-3 text-left text-muted transition hover:bg-rose-50 hover:text-rose-700"
      >
        <LogOut size={20} />
        Sair
      </button>
    </div>
  </aside>
);

export const Topbar = ({ profile }: { profile: StudentProfile }) => (
  <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-line bg-slate-50/90 px-5 backdrop-blur">
    <div className="flex h-14 w-full max-w-[620px] items-center gap-4 rounded-[8px] border border-line bg-slate-100 px-5 text-muted">
      <Search size={24} />
      <span className="truncate text-lg">{profile.estudante.curso ?? "Buscar disciplinas, módulos, conceitos..."}</span>
    </div>
    <div className="ml-4 flex items-center gap-4">
      {/* INTEGRAÇÃO: o chip fake de "streak" virou o consumo real de recursos */}
      <div className="flex h-10 items-center gap-2 rounded-[8px] bg-coral px-4 font-bold text-white">
        <TrendingUp size={19} />
        {profile.recursos.percentual_consumido}% consumido
      </div>
      <button className="relative flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-ink">
        <Bell size={22} />
        {profile.historico_intervencoes.length > 0 && (
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />
        )}
      </button>
    </div>
  </header>
);
