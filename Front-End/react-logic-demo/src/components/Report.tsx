import { FileDown, Upload } from "lucide-react";
import { StudentState } from "../types";
import { downloadStudentJson } from "../services/storage";
import { generatePedagogicalReport } from "../services/report";

interface ReportProps {
  state: StudentState;
  onImport: (state: StudentState) => void;
}

export const Report = ({ state, onImport }: ReportProps) => {
  const report = generatePedagogicalReport(state);

  const importJson = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    onImport(JSON.parse(text) as StudentState);
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="rounded-[8px] border border-line bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-ink">Relatório Pedagógico EduBot</h1>
        <p className="mt-2 text-muted">Gerado automaticamente a partir dos dados do JSON do aluno.</p>
        <pre className="mt-6 whitespace-pre-wrap rounded-[8px] bg-slate-50 p-6 text-sm leading-7 text-slate-800">{report}</pre>
      </div>

      <aside className="h-fit rounded-[8px] border border-line bg-white p-6">
        <h2 className="text-xl font-bold text-ink">Persistência JSON</h2>
        <p className="mt-2 text-sm text-muted">
          Os dados são salvos no navegador a cada atividade. Também é possível exportar o arquivo e carregá-lo novamente.
        </p>
        <button
          onClick={() => downloadStudentJson(state)}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink font-semibold text-white"
        >
          <FileDown size={18} />
          Exportar JSON
        </button>
        <label className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-line font-semibold text-ink">
          <Upload size={18} />
          Carregar JSON
          <input className="hidden" type="file" accept="application/json" onChange={(event) => importJson(event.target.files?.[0] ?? null)} />
        </label>
      </aside>
    </section>
  );
};
