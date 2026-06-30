/*
MELHORIA (Roteiro Cena 4) — Painel do Tutor / Gestão Pedagógica.

Visão de turma + Central de Alertas preventivos. O botão "Analisar turma" roda
as regras do EduBot no servidor (POST /tutor/evaluate) e gera os alertas dos
alunos em risco — o beat "o EduBot envia o plano de retomada e alerta o tutor".
*/
import { AlertTriangle, Bell, GraduationCap, LoaderCircle, RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { TurmaStudent, TutorAlert, evaluateTurma, getTurma, getTutorAlerts } from "../services/api";
import { useToast } from "./ui/Toast";

const severityStyle: Record<string, string> = {
  alta: "border-rose-200 bg-rose-50 text-rose-800",
  media: "border-amber-200 bg-amber-50 text-amber-800",
  baixa: "border-line bg-slate-50 text-slate-700"
};

export const TutorPanel = () => {
  const [alunos, setAlunos] = useState<TurmaStudent[]>([]);
  const [alertas, setAlertas] = useState<TutorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const toast = useToast();

  const load = () =>
    Promise.all([getTurma(), getTutorAlerts()])
      .then(([turma, al]) => {
        setAlunos(turma.alunos);
        setAlertas(al.alertas);
      })
      .catch(() => toast.error("Não foi possível carregar o painel da turma."))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analisar = async () => {
    setEvaluating(true);
    try {
      const { alertas_criados } = await evaluateTurma();
      toast.success(
        alertas_criados > 0
          ? `${alertas_criados} novo(s) alerta(s) gerado(s) pelo EduBot.`
          : "Análise concluída — nenhum aluno novo em zona de risco."
      );
      await load();
    } catch {
      toast.error("Não foi possível rodar a análise da turma.");
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  const alertasAbertos = alertas.filter((a) => !a.read).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-ink">
            <GraduationCap className="text-brand" /> Painel do Tutor
          </h1>
          <p className="mt-2 text-muted">Acompanhe a turma e os alertas preventivos do EduBot.</p>
        </div>
        <button
          onClick={analisar}
          disabled={evaluating}
          className="flex h-12 items-center gap-2 rounded-[8px] bg-brand px-5 font-bold text-white transition hover:bg-indigo-600 disabled:bg-slate-300"
        >
          {evaluating ? <LoaderCircle className="animate-spin" size={20} /> : <RefreshCw size={20} />}
          Analisar turma
        </button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[8px] border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-muted"><Users size={18} /> Alunos ativos</div>
          <div className="mt-2 text-3xl font-bold text-ink">{alunos.length}</div>
        </div>
        <div className="rounded-[8px] border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-muted"><Bell size={18} /> Alertas abertos</div>
          <div className="mt-2 text-3xl font-bold text-rose-600">{alertasAbertos}</div>
        </div>
        <div className="rounded-[8px] border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-muted"><AlertTriangle size={18} /> Em risco</div>
          <div className="mt-2 text-3xl font-bold text-amber-600">
            {alunos.filter((a) => a.alertas_abertos > 0 || (a.taxa_erro ?? 0) > 0.5).length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Tabela da turma */}
        <div className="overflow-hidden rounded-[8px] border border-line bg-white shadow-soft">
          <div className="border-b border-line px-5 py-3 font-bold text-ink">Alunos</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Aluno</th>
                  <th className="px-3 py-3 font-semibold">Consumo</th>
                  <th className="px-3 py-3 font-semibold">Erro quiz</th>
                  <th className="px-3 py-3 font-semibold">Sem acesso</th>
                  <th className="px-3 py-3 font-semibold">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => (
                  <tr key={a.student_id} className="border-t border-line">
                    <td className="px-5 py-3 font-semibold text-ink">
                      {a.nome} <span className="font-normal text-muted">· RA {a.ra}</span>
                    </td>
                    <td className="px-3 py-3">{a.consumo_percentual}%</td>
                    <td className="px-3 py-3">
                      {a.taxa_erro != null ? (
                        <span className={(a.taxa_erro > 0.5 ? "text-rose-600" : "text-slate-700") + " font-semibold"}>
                          {Math.round(a.taxa_erro * 100)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3">{a.dias_sem_acesso != null ? `${a.dias_sem_acesso}d` : "—"}</td>
                    <td className="px-3 py-3">
                      {a.alertas_abertos > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                          {a.alertas_abertos}
                        </span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                  </tr>
                ))}
                {alunos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-muted">
                      Nenhum aluno com atividade ainda nesta turma.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Central de alertas */}
        <aside className="rounded-[8px] border border-line bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Bell size={18} className="text-brand" /> Central de alertas
          </h2>
          <div className="mt-4 space-y-3">
            {alertas.length === 0 && (
              <p className="text-sm text-muted">
                Sem alertas. Clique em <strong>"Analisar turma"</strong> para o EduBot avaliar os alunos.
              </p>
            )}
            {alertas.map((al) => (
              <div key={al.alert_id} className={`rounded-[8px] border p-3 ${severityStyle[al.severity] ?? severityStyle.baixa}`}>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                  <span>{al.type.replace(/_/g, " ")}</span>
                  <span>{al.severity}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{al.message}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
};
