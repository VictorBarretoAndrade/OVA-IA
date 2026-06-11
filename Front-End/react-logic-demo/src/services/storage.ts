import { initialStudentState } from "../data/learningData";
import { StudentState } from "../types";
import { recalculateStudent } from "./analytics";

const storageKey = "adapta.logic.demo.student";

export const loadStudentState = (): StudentState => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return initialStudentState;

  try {
    return recalculateStudent(JSON.parse(saved) as StudentState);
  } catch {
    return initialStudentState;
  }
};

export const saveStudentState = (state: StudentState) => {
  localStorage.setItem(storageKey, JSON.stringify(state, null, 2));
};

export const downloadStudentJson = (state: StudentState) => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "student-logic-progress.json";
  link.click();
  URL.revokeObjectURL(link.href);
};
