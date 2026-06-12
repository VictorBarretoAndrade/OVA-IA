/*
INTEGRAÇÃO (4.2) — Tela de login do frontend React.
Autentica RA + senha no POST /login do backend; o token devolvido é guardado
pelo api.ts e enviado em todas as chamadas seguintes.
*/
import { GraduationCap, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { ApiError, Session, login } from "../services/api";

interface LoginProps {
  onLogged: (session: Session) => void;
}

export const Login = ({ onLogged }: LoginProps) => {
  const [ra, setRa] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      onLogged(await login(ra, password));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "RA ou senha incorretos."
          : "Não foi possível entrar — verifique se a API está no ar."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-700 via-brand to-violet-500 p-4">
      <div className="w-full max-w-md rounded-[8px] bg-white p-8 shadow-soft">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-soft">
            <GraduationCap size={27} />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none text-ink">Adapta</div>
            <div className="mt-1 text-sm tracking-[0.18em] text-muted">LEARN · IA</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-ink">Entrar na plataforma</h1>
        <p className="mt-1 text-muted">Use seu RA e senha institucionais.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="ra" className="mb-1 block text-sm font-semibold text-ink">RA</label>
            <input
              id="ra"
              value={ra}
              onChange={(event) => setRa(event.target.value)}
              className="h-12 w-full rounded-[8px] border border-line px-4 outline-none focus:border-brand"
              placeholder="Ex.: 1"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ink">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-[8px] border border-line px-4 outline-none focus:border-brand"
              placeholder="••••••"
            />
          </div>
          {error && <p className="rounded-[8px] bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
          <button
            type="submit"
            disabled={loading || !ra || !password}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-brand font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading && <LoaderCircle className="animate-spin" size={20} />}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};
