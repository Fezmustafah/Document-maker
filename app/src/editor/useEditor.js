// useEditor.js — editor state: the active letterhead + a list of placed elements.
import { useReducer } from "react";
import { buildTemplate, cloneElement, A4 } from "./model.js";

export const initialEditor = {
  letterhead: {
    id: "",
    name: "",
    dataUrl: "",
    marginTop: 52,
    marginBottom: 26,
    marginSide: 24,
    accent: "#1A2456",
  },
  elements: buildTemplate("quotation", "#1A2456"),
  selectedId: null,
  showGuides: true,
};

const clampMm = (v, max) => Math.max(0, Math.min(v, max));

function reducer(state, a) {
  switch (a.type) {
    case "SELECT":
      return { ...state, selectedId: a.id };

    case "ADD":
      return { ...state, elements: [...state.elements, a.element], selectedId: a.element.id };

    case "UPDATE":
      return {
        ...state,
        elements: state.elements.map((e) => (e.id === a.id ? { ...e, ...a.patch } : e)),
      };

    case "MOVE":
      return {
        ...state,
        elements: state.elements.map((e) =>
          e.id === a.id
            ? { ...e, xMm: clampMm(a.xMm, A4.wMm - 5), yMm: clampMm(a.yMm, A4.hMm - 3) }
            : e
        ),
      };

    case "REMOVE":
      return {
        ...state,
        elements: state.elements.filter((e) => e.id !== a.id),
        selectedId: state.selectedId === a.id ? null : state.selectedId,
      };

    case "DUPLICATE": {
      const src = state.elements.find((e) => e.id === a.id);
      if (!src) return state;
      const copy = cloneElement(src);
      return { ...state, elements: [...state.elements, copy], selectedId: copy.id };
    }

    case "RAISE":
    case "LOWER": {
      const i = state.elements.findIndex((e) => e.id === a.id);
      if (i < 0) return state;
      const els = [...state.elements];
      const [el] = els.splice(i, 1);
      const j = a.type === "RAISE" ? Math.min(i + 1, els.length) : Math.max(i - 1, 0);
      els.splice(j, 0, el);
      return { ...state, elements: els };
    }

    case "TABLE": {
      // a.op operates on the table element a.id
      return {
        ...state,
        elements: state.elements.map((e) => {
          if (e.id !== a.id || e.type !== "table") return e;
          const cols = e.columns.map((c) => ({ ...c }));
          const rows = e.rows.map((r) => [...r]);
          switch (a.op) {
            case "cell":
              rows[a.r][a.c] = a.value;
              return { ...e, rows };
            case "label":
              cols[a.c] = { ...cols[a.c], label: a.value };
              return { ...e, columns: cols };
            case "align":
              cols[a.c] = { ...cols[a.c], align: a.value };
              return { ...e, columns: cols };
            case "addRow":
              return { ...e, rows: [...rows, cols.map(() => "")] };
            case "delRow":
              return { ...e, rows: rows.filter((_, i) => i !== a.r) };
            case "addCol":
              return {
                ...e,
                columns: [...cols, { label: "Column", align: "right" }],
                rows: rows.map((r) => [...r, ""]),
                colFlex: null,
              };
            case "delCol":
              return {
                ...e,
                columns: cols.filter((_, i) => i !== a.c),
                rows: rows.map((r) => r.filter((_, i) => i !== a.c)),
                colFlex: null,
              };
            default:
              return e;
          }
        }),
      };
    }

    case "LOAD_TEMPLATE":
      return {
        ...state,
        elements: buildTemplate(a.id, state.letterhead.accent),
        selectedId: null,
      };

    case "SET_LETTERHEAD":
      return { ...state, letterhead: { ...state.letterhead, ...a.patch } };

    case "SET_ELEMENTS":
      return { ...state, elements: a.elements || [], selectedId: null };

    case "TOGGLE_GUIDES":
      return { ...state, showGuides: !state.showGuides };

    default:
      return state;
  }
}

export function useEditor() {
  return useReducer(reducer, initialEditor);
}
