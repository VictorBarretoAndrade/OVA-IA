import { Award, BarChart3, Bell, BookOpen, CalendarDays, Flame, GraduationCap, Grid2X2, MessageCircle, Search } from "lucide-react";

interface SidebarProps {
  activeView: string;
  onChangeView: (view: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Grid2X2 },
  { id: "contents", label: "Conteúdos", icon: BookOpen },
  { id: "exercises", label: "Exercícios", icon: CalendarDays },
  { id: "quiz", label: "Quiz", icon: Award },
  { id: "evolution", label: "Meu Desempenho", icon: BarChart3 },
  { id: "report", label: "Tutor IA", icon: MessageCircle }
];

export const Sidebar = ({ activeView, onChangeView }: SidebarProps) => (
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
  </aside>
);

export const Topbar = () => (
  <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-line bg-slate-50/90 px-5 backdrop-blur">
    <div className="flex h-14 w-full max-w-[620px] items-center gap-4 rounded-[8px] border border-line bg-slate-100 px-5 text-muted">
      <Search size={24} />
      <span className="truncate text-lg">Buscar disciplinas, módulos, conceitos...</span>
    </div>
    <div className="ml-4 flex items-center gap-4">
      <div className="flex h-10 items-center gap-2 rounded-[8px] bg-coral px-4 font-bold text-white">
        <Flame size={19} />
        12 dias
      </div>
      <button className="relative flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-ink">
        <Bell size={22} />
        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />
      </button>
    </div>
  </header>
);
