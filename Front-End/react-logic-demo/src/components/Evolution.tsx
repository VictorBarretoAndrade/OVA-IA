/*
INTEGRAÇÃO — Gráficos gerados a partir do perfil real (GET /student/me):
competências (acertos/total por competência) e consumo por tipo de recurso
(texto/vídeo/podcast/quiz/atividade). Mantém o Recharts do protótipo.
*/
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { StudentProfile } from "../services/api";

interface EvolutionProps {
  profile: StudentProfile;
}

export const Evolution = ({ profile }: EvolutionProps) => {
  const competencyData = profile.competencias.map((item, index) => ({
    nome: `Comp. ${index + 1}`,
    completo: item.nome,
    score: item.total_questoes ? Math.round((100 * item.acertos) / item.total_questoes) : 0,
    status: item.status
  }));

  const typeData = Object.entries(profile.recursos.por_tipo).map(([tipo, stats]) => ({
    tipo,
    consumidos: stats.consumidos,
    total: stats.total
  }));

  const ovaData = profile.ovas.map((ova) => ({
    nome: ova.ova_name.length > 18 ? `${ova.ova_name.slice(0, 18)}…` : ova.ova_name,
    "percentual lido": ova.perc_scrolled || 0,
    "minutos de leitura": Math.round((ova.read_time || 0) / 60)
  }));

  return (
    <section>
      <h1 className="text-3xl font-bold text-ink">Evolução do Aluno</h1>
      <p className="mt-2 text-muted">Gráficos gerados a partir dos dados rastreados no backend.</p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Teia de competências (gráfico radar) — visão do domínio do aluno */}
        <div className="rounded-[8px] border border-line bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-xl font-bold text-ink">Teia de competências</h2>
          <p className="mt-1 text-sm text-muted">% de acertos por competência (quanto mais cheia a teia, melhor o domínio).</p>
          <div className="mt-5 h-96">
            <ResponsiveContainer>
              <RadarChart data={competencyData} outerRadius="72%">
                <PolarGrid />
                <PolarAngleAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "acertos"]}
                  labelFormatter={(label: string) => {
                    const item = competencyData.find((entry) => entry.nome === label);
                    return item ? `${item.completo} (${item.status})` : label;
                  }}
                />
                <Radar name="Acertos" dataKey="score" stroke="#604fd8" fill="#604fd8" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Leitura por OVA</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer>
              <BarChart data={ovaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" interval={0} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="percentual lido" fill="#604fd8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="minutos de leitura" fill="#ff7b65" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Consumo por tipo de recurso</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" interval={0} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="consumidos" fill="#15beb5" radius={[8, 8, 0, 0]} />
                <Bar dataKey="total" fill="#dfe5ef" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[8px] border border-line bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-xl font-bold text-ink">Competências desenvolvidas</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer>
              <BarChart data={competencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" interval={0} height={50} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "acertos"]}
                  labelFormatter={(label: string) => {
                    const item = competencyData.find((entry) => entry.nome === label);
                    return item ? `${item.completo} (${item.status})` : label;
                  }}
                />
                <Bar dataKey="score" fill="#15beb5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
