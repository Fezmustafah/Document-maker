// useDocState.js — central form state (useReducer). One flat-ish object.
import { useReducer } from "react";

export const DOC_TYPES = [
  { id: "tax-invoice", label: "Tax Invoice", title: "Tax Invoice" },
  { id: "invoice", label: "Invoice", title: "Invoice" },
  { id: "quotation", label: "Quotation", title: "Quotation" },
  { id: "proforma", label: "Proforma Invoice", title: "Proforma Invoice" },
  { id: "statement", label: "Statement of Account", title: "Statement of Account" },
  { id: "letter", label: "Letter", title: "" },
];

export function blankItem() {
  return { description: "", qty: "", unit: "", amount: "" };
}

export function blankLedgerRow() {
  return { date: "", ref: "", debit: "", credit: "" };
}

export const initialState = {
  // letterhead (set via library in Phase 5; inline upload meanwhile)
  letterheadDataUrl: "",
  letterheadName: "",
  letterheadId: "",
  accent: "#1A2456",
  margins: { top: 52, bottom: 26, side: 24 },

  docType: "tax-invoice",
  title: "Tax Invoice",
  subTitle: "",
  refLabel: "NO",
  refNumber: "",
  date: "",

  party: { label: "Bill To", address: "", ownTrn: "", clientTrn: "" },

  currency: "AED",
  items: [blankItem(), blankItem(), blankItem()],
  vatPercent: 5,
  showAmountInWords: true,

  // quotation/proforma
  intro: "",
  validity: "This quotation is valid for 30 days from the date above.",

  // footer
  bank: { heading: "Bank Details", linesText: "" },
  closingNote: "",
  signature: { name: "", title: "" },

  // letter mode
  subject: "",
  salutation: "Dear Sir/Madam,",
  body: "",
  closingLine: "",

  // statement (ledger) mode
  fromBlock: "",
  opening: 0,
  ledger: [blankLedgerRow(), blankLedgerRow()],
};

function reducer(state, action) {
  switch (action.type) {
    case "SET":
      return { ...state, [action.key]: action.value };
    case "SET_NESTED":
      return {
        ...state,
        [action.group]: { ...state[action.group], [action.key]: action.value },
      };
    case "SET_DOCTYPE": {
      const dt = DOC_TYPES.find((d) => d.id === action.value);
      return { ...state, docType: action.value, title: dt ? dt.title : state.title };
    }
    case "SET_ITEM": {
      const items = state.items.map((it, i) =>
        i === action.index ? { ...it, [action.key]: action.value } : it
      );
      return { ...state, items };
    }
    case "ADD_ITEM":
      return { ...state, items: [...state.items, blankItem()] };
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((_, i) => i !== action.index),
      };
    case "SET_LEDGER": {
      const ledger = state.ledger.map((r, i) =>
        i === action.index ? { ...r, [action.key]: action.value } : r
      );
      return { ...state, ledger };
    }
    case "ADD_LEDGER":
      return { ...state, ledger: [...state.ledger, blankLedgerRow()] };
    case "REMOVE_LEDGER":
      return {
        ...state,
        ledger: state.ledger.filter((_, i) => i !== action.index),
      };
    case "SET_LETTERHEAD":
      // payload: { letterheadDataUrl, letterheadName, letterheadId, accent, margins }
      return { ...state, ...action.payload };
    case "SET_MARGIN":
      return {
        ...state,
        margins: { ...state.margins, [action.key]: action.value },
      };
    case "LOAD_PRESET":
      return { ...state, ...action.payload };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

export function useDocState() {
  return useReducer(reducer, initialState);
}
