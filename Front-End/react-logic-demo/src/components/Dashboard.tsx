/*
INTEGRAÇÃO — Dashboard alimentado pelo perfil real (GET /student/me):
nome/curso do aluno, consumo de recursos, taxa de erro do quiz, dias sem
acesso, formato preferido e competências com status do backend.
Layout e identidade visual do protótipo Lovable preservados.
*/
import { Bell, Code2, Timer, Trophy, ClipboardCheck, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { StudentProfile } from "../services/api";

interface DashboardProps {
  profile: StudentProfile;
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

const statusColor: Record<string, string> = {
  "desenvolvida": "bg-teal",
  "em desenvolvimento": "bg-coral",
  "não iniciada": "bg-slate-300"
};

export const Dashboard = ({ profile, onOpenContent }: DashboardProps) => {
  const progresso = profile.recursos.percentual_consumido;
  const radialData = [{ name: "progresso", value: progresso, fill: "#604fd8" }];
  const totalReadMinutes = Math.round(profile.ovas.reduce((sum, ova) => sum + (ova.read_time || 0), 0) / 60);
  const quizScore =
    profile.quiz.taxa_erro != null ? `${Math.round((1 - profile.quiz.taxa_erro) * 100)}%` : "—";
  const allResources = profile.ovas.flatMap((ova) => ova.recursos);
  const completedActivities = allResources.filter((r) => r.tipo === "atividade" && r.concluido).length;
  const totalActivities = allResources.filter((r) => r.tipo === "atividade").length;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-lg text-muted">Dashboard do Aluno</p>
        <h1 className="mt-1 text-4xl font-bold text-ink">{profile.estudante.nome}</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[8px] border border-line bg-white shadow-soft">
          <div className="relative min-h-[245px] bg-gradient-to-br from-indigo-700 via-brand to-violet-500 p-8 text-white">
            <div className="absolute -left-12 top-20 h-52 w-52 rounded-full border-[7px] border-white/10" />
            <div className="absolute right-10 top-[-45px] h-48 w-48 rounded-full border-[7px] border-white/10" />
            <Code2 className="relative z-10 mb-8" size={62} />
            <div className="relative z-10 max-w-lg">
              <p className="font-semibold opacity-90">RA {profile.estudante.ra}</p>
              <h2 className="mt-2 text-3xl font-bold">{profile.estudante.curso ?? "Meu curso"}</h2>
              <p className="mt-3 text-lg text-white/85">
                {profile.dias_sem_acesso != null && profile.dias_sem_acesso > 0
                  ? `Você está há ${profile.dias_sem_acesso} dia(s) sem interagir — que tal retomar hoje?`
                  : "Sua jornada de aprendizagem rastreada pelo EduBot."}
              </p>
            </div>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-4">
            <Metric label="Tempo de leitura" value={`${totalReadMinutes} min`} icon={Timer} />
            <Metric label="Atividades práticas" value={`${completedActivities}/${totalActivities}`} icon={ClipboardCheck} />
            <Metric label="Acerto nos quizzes" value={quizScore} icon={Trophy} />
            <Metric label="Recursos consumidos" value={`${progresso}%`} icon={TrendingUp} />
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-ink">Progresso</h3>
              <p className="text-sm text-muted">
                {profile.recursos.consumidos} de {profile.recursos.total} recursos consumidos.
              </p>
            </div>
          </div>
          <div className="relative mt-4 h-56">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="68%" outerRadius="95%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} background />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Sobreposição centralizada no donut (centro exato, nos dois eixos) */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold leading-none text-ink">{progresso}%</span>
              <span className="mt-1 text-sm text-muted">concluído</span>
            </div>
          </div>
          <button onClick={onOpenContent} className="mt-6 h-11 w-full rounded-[8px] bg-ink font-semibold text-white">
            Continuar estudando
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[8px] border border-line bg-white p-6">
          <h3 className="text-xl font-bold text-ink">Competências desenvolvidas</h3>
          <div className="mt-5 space-y-4">
            {profile.competencias.map((item) => {
              const score = item.total_questoes ? Math.round((100 * item.acertos) / item.total_questoes) : 0;
              return (
                <div key={item.competency_id}>
                  <div className="mb-2 flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-ink">{item.nome}</span>
                    <span className="shrink-0 text-muted">{item.status}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${statusColor[item.status] ?? "bg-teal"}`}
                      style={{ width: `${Math.max(score, item.status === "não iniciada" ? 0 : 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white p-6">
          <h3 className="flex items-center gap-2 text-xl font-bold text-ink">
            <Bell size={20} className="text-brand" /> Avisos do EduBot
          </h3>
          <div className="mt-4 space-y-3">
            {profile.historico_intervencoes.slice(0, 5).map((item, index) => (
              <div key={`${item.data}-${index}`} className="rounded-[8px] bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-bold uppercase tracking-wide">{item.tipo}</span>
                  <span>{item.data}</span>
                </div>
                {item.descricao && <p className="mt-2 text-sm text-slate-700">{item.descricao}</p>}
              </div>
            ))}
            {profile.historico_intervencoes.length === 0 && (
              <p className="rounded-[8px] bg-slate-50 p-4 text-sm text-muted">
                Sem avisos por enquanto. Continue estudando e responda aos quizzes — o EduBot vai sugerir os
                próximos passos por aqui.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {profile.ovas.map((ova) => (
          <div key={ova.ova_id} className="rounded-[8px] border border-line bg-white p-5">
            <div className="text-sm font-semibold text-brand">{ova.completed ? "Concluído" : "Em andamento"}</div>
            <div className="mt-2 font-bold text-ink">{ova.ova_name}</div>
            <div className="mt-2 text-sm text-muted">
              {ova.perc_scrolled || 0}% lido · {ova.recursos.filter((r) => r.consumido).length}/{ova.recursos.length} recursos
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
