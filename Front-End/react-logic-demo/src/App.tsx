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
import { OvaState, Session, StudentProfile, clearSession, getMe, getSession, getToken } from "./services/api";
import { useT } from "./i18n";

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
const OvaReader = lazy(() => import("./components/ova/OvaReader").then((m) => ({ default: m.OvaReader })));
const TutorPanel = lazy(() => import("./components/TutorPanel").then((m) => ({ default: m.TutorPanel })));

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
  // OVA aberto no leitor nativo (null = nenhum). Tem precedência sobre activeView.
  const [readerOva, setReaderOva] = useState<OvaState | null>(null);
  const t = useT();

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
        setError("load_failed");
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
    setReaderOva(null);
    setActiveView("dashboard");
  };

  // Troca de aba pela sidebar/topbar sempre fecha o leitor de OVA aberto.
  const changeView = (view: string) => {
    setReaderOva(null);
    setActiveView(view);
  };

  // Abre um OVA no leitor nativo (chamado pela Área de Conteúdo)
  const openOva = (ova: OvaState) => {
    setReaderOva(ova);
    window.scrollTo({ top: 0 });
  };

  if (!session) {
    return <Login onLogged={(logged) => setSession(logged)} />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-muted">
        <LoaderCircle className="animate-spin text-brand" size={40} />
        {error ? (
          <p className="font-semibold text-rose-600">
            {t("Não foi possível carregar seus dados. A API está no ar?", "Couldn't load your data. Is the API up?")}
          </p>
        ) : (
          <p>{t("Carregando seu perfil...", "Loading your profile...")}</p>
        )}
      </div>
    );
  }

  const renderView = () => {
    // O leitor de OVA tem precedência sobre a aba ativa
    if (readerOva && session) {
      return (
        <OvaReader
          ova={readerOva}
          studentId={session.student_id}
          onBack={() => setReaderOva(null)}
          onTracked={refreshProfile}
        />
      );
    }
    if (activeView === "contents") return <Contents profile={profile} onTracked={refreshProfile} onOpenOva={openOva} />;
    if (activeView === "exercises") return <Exercises profile={profile} onTracked={refreshProfile} />;
    if (activeView === "quiz") return <Quiz profile={profile} onTracked={refreshProfile} />;
    if (activeView === "reforco") return <Reforco profile={profile} onTracked={refreshProfile} />;
    if (activeView === "evolution") return <Evolution profile={profile} />;
    if (activeView === "tutor") return <TutorPanel />;
    if (activeView === "report") return <Report profile={profile} onTracked={refreshProfile} />;
    return (
      <Dashboard
        profile={profile}
        onOpenContent={() => changeView("contents")}
        onOpenReforco={() => changeView("reforco")}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <div className="flex">
        <Sidebar activeView={readerOva ? "contents" : activeView} onChangeView={changeView} studentName={profile.estudante.nome} role={profile.estudante.role} onLogout={logout} />
        <main className="min-w-0 flex-1">
          <Topbar profile={profile} onChangeView={changeView} />
          <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-10">
            <Suspense fallback={<ViewFallback />}>{renderView()}</Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
