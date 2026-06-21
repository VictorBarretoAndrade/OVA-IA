/*
INTEGRAÇÃO (EduBot Track) — o app deixou de ser um demo isolado em localStorage
e passou a consumir o backend Flask:
  - Sem token -> tela de Login (POST /login)
  - Logado    -> perfil real via GET /student/me alimenta todas as views
O visual original (Lovable) foi mantido; apenas a fonte dos dados mudou.
*/
import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Sidebar, Topbar } from "./components/Sidebar";
import { Login } from "./components/Login";
import { LoaderCircle } from "lucide-react";
import { Session, StudentProfile, clearSession, getMe, getSession, getToken } from "./services/api";

// MELHORIA — cada tela vira um chunk separado (React.lazy), então o app só baixa
// o código da aba que o aluno abrir, em vez de tudo (inclusive os gráficos
// pesados do Recharts) no primeiro carregamento.
const Dashboard = lazy(() => import("./components/Dashboard").then((m) => ({ default: m.Dashboard })));
const Contents = lazy(() => import("./components/Contents").then((m) => ({ default: m.Contents })));
const Evolution = lazy(() => import("./components/Evolution").then((m) => ({ default: m.Evolution })));
const Exercises = lazy(() => import("./components/Exercises").then((m) => ({ default: m.Exercises })));
const Quiz = lazy(() => import("./components/Quiz").then((m) => ({ default: m.Quiz })));
const Reforco = lazy(() => import("./components/Reforco").then((m) => ({ default: m.Reforco })));
const Report = lazy(() => import("./components/Report").then((m) => ({ default: m.Report })));

const ViewFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <LoaderCircle className="animate-spin text-brand" size={32} />
  </div>
);

const App = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [session, setSession] = useState<Session | null>(() => (getToken() ? getSession() : null));
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // (Re)carrega o perfil completo do aluno — chamado no login e após cada
  // ação rastreada (progresso de mídia, quiz, recomendação), mantendo
  // dashboard/competências sempre coerentes com o backend
  const refreshProfile = useCallback(async () => {
    try {
      setProfile(await getMe());
      setError(null);
    } catch (err) {
      // Token inválido/expirado -> volta para o login
      if ((err as { status?: number }).status === 401) {
        setSession(null);
        setProfile(null);
      } else {
        setError("Não foi possível carregar seus dados. A API está no ar?");
      }
    }
  }, []);

  useEffect(() => {
    if (session) refreshProfile();
  }, [session, refreshProfile]);

  const logout = () => {
    clearSession();
    setSession(null);
    setProfile(null);
    setActiveView("dashboard");
  };

  if (!session) {
    return <Login onLogged={(logged) => setSession(logged)} />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-muted">
        <LoaderCircle className="animate-spin text-brand" size={40} />
        {error ? <p className="font-semibold text-rose-600">{error}</p> : <p>Carregando seu perfil...</p>}
      </div>
    );
  }

  const renderView = () => {
    if (activeView === "contents") return <Contents profile={profile} onTracked={refreshProfile} />;
    if (activeView === "exercises") return <Exercises profile={profile} onTracked={refreshProfile} />;
    if (activeView === "quiz") return <Quiz profile={profile} onTracked={refreshProfile} />;
    if (activeView === "reforco") return <Reforco profile={profile} onTracked={refreshProfile} />;
    if (activeView === "evolution") return <Evolution profile={profile} />;
    if (activeView === "report") return <Report profile={profile} onTracked={refreshProfile} />;
    return <Dashboard profile={profile} onOpenContent={() => setActiveView("contents")} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <div className="flex">
        <Sidebar activeView={activeView} onChangeView={setActiveView} studentName={profile.estudante.nome} onLogout={logout} />
        <main className="min-w-0 flex-1">
          <Topbar profile={profile} onChangeView={setActiveView} />
          <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-10">
            <Suspense fallback={<ViewFallback />}>{renderView()}</Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
