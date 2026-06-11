import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StudentState } from "../types";

interface EvolutionProps {
  state: StudentState;
}

export const Evolution = ({ state }: EvolutionProps) => (
  <section>
    <h1 className="text-3xl font-bold text-ink">Evolução do Aluno</h1>
    <p className="mt-2 text-muted">Gráficos simples gerados a partir do JSON persistido localmente.</p>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <div className="rounded-[8px] border border-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Progresso ao longo do tempo</h2>
        <div className="mt-5 h-72">
          <ResponsiveContainer>
            <LineChart data={state.evolucao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="progresso" stroke="#604fd8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[8px] border border-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Evolução da nota</h2>
        <div className="mt-5 h-72">
          <ResponsiveContainer>
            <LineChart data={state.evolucao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="nota" stroke="#ff7b65" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[8px] border border-line bg-white p-6 shadow-sm xl:col-span-2">
        <h2 className="text-xl font-bold text-ink">Competências desenvolvidas</h2>
        <div className="mt-5 h-80">
          <ResponsiveContainer>
            <BarChart data={state.competencias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" interval={0} height={80} tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#15beb5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </section>
);
