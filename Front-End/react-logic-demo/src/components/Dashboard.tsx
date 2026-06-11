import { Code2, Timer, Trophy, ClipboardCheck, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { StudentState } from "../types";
import { contents } from "../data/learningData";
import { toExpectedJson } from "../services/analytics";

interface DashboardProps {
  state: StudentState;
  onOpenContent: () => void;
}

const Metric = ({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) => (
  <div className="rounded-[8px] border border-line bg-white p-5 shadow-sm">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[8px] bg-slate-100 text-brand">
      <Icon size={22} />
    </div>
    <div className="text-2xl font-bold text-ink">{value}</div>
    <div className="mt-1 text-sm text-muted">{label}</div>
  </div>
);

export const Dashboard = ({ state, onOpenContent }: DashboardProps) => {
  const radialData = [{ name: "progresso", value: state.modulo.progresso, fill: "#604fd8" }];
  const exported = toExpectedJson(state);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-lg text-muted">Dashboard do Aluno</p>
        <h1 className="mt-1 text-4xl font-bold text-ink">{state.modulo.nome}</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[8px] border border-line bg-white shadow-soft">
          <div className="relative min-h-[245px] bg-gradient-to-br from-indigo-700 via-brand to-violet-500 p-8 text-white">
            <div className="absolute -left-12 top-20 h-52 w-52 rounded-full border-[7px] border-white/10" />
            <div className="absolute right-10 top-[-45px] h-48 w-48 rounded-full border-[7px] border-white/10" />
            <Code2 className="relative z-10 mb-8" size={62} />
            <div className="relative z-10 max-w-lg">
              <p className="font-semibold opacity-90">CC101</p>
              <h2 className="mt-2 text-3xl font-bold">Lógica de Programação</h2>
              <p className="mt-3 text-lg text-white/85">Fundamentos do raciocínio computacional, algoritmos, decisões e repetições.</p>
            </div>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-4">
            <Metric label="Tempo total estudado" value={`${state.engajamento.tempo_total_estudo} min`} icon={Timer} />
            <Metric label="Exercícios resolvidos" value={`${state.exercicios.realizados}/5`} icon={ClipboardCheck} />
            <Metric label="Média dos quizzes" value={state.quizzes.media ? state.quizzes.media.toFixed(1) : "0.0"} icon={Trophy} />
            <Metric label="Progresso geral" value={`${state.modulo.progresso}%`} icon={TrendingUp} />
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-ink">Progresso</h3>
              <p className="text-sm text-muted">Cálculo por conteúdo, exercícios e quiz.</p>
            </div>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="68%" outerRadius="95%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} background />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-36 flex h-28 flex-col items-center justify-center">
            <span className="text-4xl font-bold text-ink">{state.modulo.progresso}%</span>
            <span className="text-sm text-muted">concluído</span>
          </div>
          <button onClick={onOpenContent} className="mt-12 h-11 w-full rounded-[8px] bg-ink font-semibold text-white">
            Continuar estudando
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[8px] border border-line bg-white p-6">
          <h3 className="text-xl font-bold text-ink">Competências desenvolvidas</h3>
          <div className="mt-5 space-y-4">
            {state.competencias.map((item) => (
              <div key={item.nome}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-ink">{item.nome}</span>
                  <span className="text-muted">{item.status}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-teal" style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white p-6">
          <h3 className="text-xl font-bold text-ink">Modelo JSON salvo</h3>
          <pre className="mt-4 max-h-80 overflow-auto rounded-[8px] bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
            {JSON.stringify(exported, null, 2)}
          </pre>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {contents.map((content) => (
          <div key={content.id} className="rounded-[8px] border border-line bg-white p-5">
            <div className="text-sm font-semibold text-brand">{content.type}</div>
            <div className="mt-2 font-bold text-ink">{content.title}</div>
            <div className="mt-2 text-sm text-muted">{content.durationMinutes} min previstos</div>
          </div>
        ))}
      </div>
    </section>
  );
};
