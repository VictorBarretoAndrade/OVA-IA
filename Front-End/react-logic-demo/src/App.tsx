import { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { ContentArea } from "./components/ContentArea";
import { Evolution } from "./components/Evolution";
import { Exercises } from "./components/Exercises";
import { Quiz } from "./components/Quiz";
import { Report } from "./components/Report";
import { Sidebar, Topbar } from "./components/Sidebar";
import { StudentState } from "./types";
import { loadStudentState, saveStudentState } from "./services/storage";
import { recalculateStudent } from "./services/analytics";

const App = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [studentState, setStudentState] = useState<StudentState>(() => recalculateStudent(loadStudentState()));

  useEffect(() => {
    saveStudentState(studentState);
  }, [studentState]);

  useEffect(() => {
    const saveOnExit = () => saveStudentState(studentState);
    window.addEventListener("beforeunload", saveOnExit);
    return () => window.removeEventListener("beforeunload", saveOnExit);
  }, [studentState]);

  const importState = (state: StudentState) => {
    setStudentState(recalculateStudent(state));
    setActiveView("dashboard");
  };

  const renderView = () => {
    if (activeView === "contents") return <ContentArea state={studentState} onUpdate={setStudentState} />;
    if (activeView === "exercises") return <Exercises state={studentState} onUpdate={setStudentState} />;
    if (activeView === "quiz") return <Quiz state={studentState} onUpdate={setStudentState} />;
    if (activeView === "evolution") return <Evolution state={studentState} />;
    if (activeView === "report") return <Report state={studentState} onImport={importState} />;
    return <Dashboard state={studentState} onOpenContent={() => setActiveView("contents")} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <div className="flex">
        <Sidebar activeView={activeView} onChangeView={setActiveView} />
        <main className="min-w-0 flex-1">
          <Topbar />
          <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-10">{renderView()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
