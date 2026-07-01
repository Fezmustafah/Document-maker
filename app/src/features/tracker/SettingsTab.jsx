// SettingsTab — editable seller / buyer / item defaults, persisted to IndexedDB.
import { useState } from "react";
import { TRACKER_TEMPLATES } from "./constants.js";

function Field({ label, value, onChange, type = "text", multiline = false }) {
  const cls =
    "w-full rounded-lg border border-tcreamDark bg-white px-3 py-2 text-sm outline-none focus:border-tgold focus:ring-2 focus:ring-tgold/30";
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-tnavy/70">{label}</span>
      {multiline ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className={cls + " resize-none"} />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          className={cls}
        />
      )}
    </label>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-tcreamDark bg-white p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-tnavy">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// Editable list of custom label/value fields for a party. Empty rows are kept
// while editing and dropped from the PDF (see format.extraLines).
function ExtraFields({ fields, onChange }) {
  const inputCls =
    "rounded-lg border border-tcreamDark bg-white px-3 py-2 text-sm outline-none focus:border-tgold focus:ring-2 focus:ring-tgold/30";
  const set = (i, key, v) => onChange(fields.map((f, idx) => (idx === i ? { ...f, [key]: v } : f)));
  const add = () => onChange([...fields, { label: "", value: "" }]);
  const remove = (i) => onChange(fields.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2 border-t border-tcreamDark pt-3">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-tnavy/70">Custom fields</span>
      {fields.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={f.label}
            onChange={(e) => set(i, "label", e.target.value)}
            placeholder="Label (e.g. Phone 2)"
            className={inputCls + " w-2/5"}
          />
          <input
            value={f.value}
            onChange={(e) => set(i, "value", e.target.value)}
            placeholder="Value"
            className={inputCls + " flex-1"}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            title="Remove field"
            className="rounded-lg px-2.5 py-2 text-lg font-bold text-[#C0392B] hover:bg-red-50"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-tnavy px-3 py-1.5 text-sm font-semibold text-tnavy hover:bg-tcream"
      >
        + Add field
      </button>
    </div>
  );
}

export default function SettingsTab({ settings, onSave, letterheads = [] }) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  const set = (group, key) => (v) => {
    setDraft((d) => ({ ...d, [group]: { ...d[group], [key]: v } }));
    setSaved(false);
  };
  const header = draft.header || { style: "drawn", letterheadId: null };
  const setHeader = (patch) => {
    setDraft((d) => ({ ...d, header: { ...d.header, ...patch } }));
    setSaved(false);
  };
  const theme = draft.theme || "classic";
  const setTheme = (t) => { setDraft((d) => ({ ...d, theme: t })); setSaved(false); };

  // custom fields: seller (object) + active buyer (roster entry)
  const setSellerExtra = (next) => {
    setDraft((d) => ({ ...d, seller: { ...d.seller, extra: next } }));
    setSaved(false);
  };
  const setBuyerExtra = (next) => {
    setDraft((d) => ({ ...d, buyers: d.buyers.map((b) => (b.id === d.buyerId ? { ...b, extra: next } : b)) }));
    setSaved(false);
  };

  // seller beneficiary bank details (nested under seller.bank)
  const bank = draft.seller.bank || {};
  const setBank = (key) => (v) => {
    setDraft((d) => ({ ...d, seller: { ...d.seller, bank: { ...(d.seller.bank || {}), [key]: v } } }));
    setSaved(false);
  };

  const items = draft.items || [];
  const setItem = (i, key, v) => {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it, idx) => (idx === i ? { ...it, [key]: key === "unitPrice" ? Number(v) : v } : it)),
    }));
    setSaved(false);
  };
  const addItem = () => {
    setDraft((d) => ({ ...d, items: [...d.items, { description: "", unitPrice: 0 }] }));
    setSaved(false);
  };
  const removeItem = (i) => {
    setDraft((d) => ({ ...d, items: d.items.length > 1 ? d.items.filter((_, idx) => idx !== i) : d.items }));
    setSaved(false);
  };
  const setVat = (v) => {
    setDraft((d) => ({ ...d, vatRate: Number(v) }));
    setSaved(false);
  };

  // ---- buyer roster ----
  const buyers = draft.buyers || [];
  const activeBuyer = buyers.find((b) => b.id === draft.buyerId) || buyers[0] || { id: "default" };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pickBuyer = (id) => { setDraft((d) => ({ ...d, buyerId: id })); setSaved(false); };
  const setBuyerField = (key) => (v) => {
    setDraft((d) => ({
      ...d,
      buyers: d.buyers.map((b) => (b.id === d.buyerId ? { ...b, [key]: v } : b)),
    }));
    setSaved(false);
  };
  const addBuyer = () => {
    const id = uid();
    setDraft((d) => ({ ...d, buyers: [...d.buyers, { id, name: "New Company", address: "", phone: "", trn: "" }], buyerId: id }));
    setSaved(false);
  };
  const removeBuyer = () => {
    setDraft((d) => {
      if (d.buyers.length <= 1) return d;
      const buyers = d.buyers.filter((b) => b.id !== d.buyerId);
      return { ...d, buyers, buyerId: buyers[0].id };
    });
    setSaved(false);
  };

  function save() {
    // mirror the active buyer into `buyer` so the PDFs use it immediately
    const active = (draft.buyers || []).find((b) => b.id === draft.buyerId) || draft.buyer;
    onSave({ ...draft, buyer: { ...active } });
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Seller">
          <Field label="Name" value={draft.seller.name} onChange={set("seller", "name")} />
          <Field label="Name (Arabic)" value={draft.seller.nameAr} onChange={set("seller", "nameAr")} />
          <Field label="Address" value={draft.seller.address} onChange={set("seller", "address")} />
          <Field label="Phone" value={draft.seller.phone} onChange={set("seller", "phone")} />
          <Field label="Email" value={draft.seller.email} onChange={set("seller", "email")} />
          <Field label="TRN" value={draft.seller.trn} onChange={set("seller", "trn")} />
          <ExtraFields fields={draft.seller.extra || []} onChange={setSellerExtra} />
        </Card>
        <Card title="Buyer">
          <div className="flex items-end gap-2">
            <label className="block flex-1">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-tnavy/70">Company</span>
              <select
                value={draft.buyerId}
                onChange={(e) => pickBuyer(e.target.value)}
                className="w-full rounded-lg border border-tcreamDark bg-white px-3 py-2 text-sm text-tnavy outline-none focus:border-tgold focus:ring-2 focus:ring-tgold/30"
              >
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>{b.name || "Unnamed company"}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={addBuyer} title="Add a company"
              className="rounded-lg border border-tnavy px-3 py-2 text-sm font-semibold text-tnavy hover:bg-tcream">+ New</button>
            <button type="button" onClick={removeBuyer} disabled={buyers.length <= 1} title="Remove this company"
              className="rounded-lg px-2.5 py-2 text-lg font-bold text-[#C0392B] disabled:opacity-30 hover:bg-red-50">×</button>
          </div>
          <Field label="Name" value={activeBuyer.name || ""} onChange={setBuyerField("name")} />
          <Field label="Registered address (tax notice)" value={activeBuyer.address || ""} onChange={setBuyerField("address")} multiline />
          <Field label="Phone" value={activeBuyer.phone || ""} onChange={setBuyerField("phone")} />
          <Field label="TRN" value={activeBuyer.trn || ""} onChange={setBuyerField("trn")} />
          <ExtraFields fields={activeBuyer.extra || []} onChange={setBuyerExtra} />
          <p className="text-[11px] text-slate">The selected company is used on all invoices &amp; the weekly statement.</p>
        </Card>
      </div>

      <Card title="Beneficiary bank details">
        <p className="text-[11px] text-slate">
          Printed on every tax invoice and the weekly statement so the buyer can pay. Leave all blank to hide the block.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Bank name" value={bank.bankName || ""} onChange={setBank("bankName")} />
          <Field label="Account name" value={bank.accountName || ""} onChange={setBank("accountName")} />
          <Field label="Account number" value={bank.accountNo || ""} onChange={setBank("accountNo")} />
          <Field label="IBAN" value={bank.iban || ""} onChange={setBank("iban")} />
          <Field label="SWIFT / BIC" value={bank.swift || ""} onChange={setBank("swift")} />
        </div>
      </Card>

      <Card title="Items & VAT">
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-tnavy/70">{i === 0 ? "Item" : `Item ${i + 1}`}</span>
                <input
                  value={it.description}
                  onChange={(e) => setItem(i, "description", e.target.value)}
                  placeholder="e.g. Mutton Biryani (Parcel)"
                  className="w-full rounded-lg border border-tcreamDark bg-white px-3 py-2 text-sm outline-none focus:border-tgold focus:ring-2 focus:ring-tgold/30"
                />
              </div>
              <div className="w-28">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-tnavy/70">Price (AED)</span>
                <input
                  type="number"
                  value={it.unitPrice}
                  onChange={(e) => setItem(i, "unitPrice", e.target.value)}
                  className="w-full rounded-lg border border-tcreamDark bg-white px-3 py-2 text-sm outline-none focus:border-tgold focus:ring-2 focus:ring-tgold/30"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={items.length <= 1}
                title="Remove item"
                className="mb-0.5 rounded-lg px-2.5 py-2 text-lg font-bold text-[#C0392B] disabled:opacity-30 hover:bg-red-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg border border-tnavy px-3 py-1.5 text-sm font-semibold text-tnavy hover:bg-tcream"
          >
            + Add item
          </button>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-tnavy/70">VAT rate (%)</span>
            <input
              type="number"
              value={draft.vatRate}
              onChange={(e) => setVat(e.target.value)}
              className="w-28 rounded-lg border border-tcreamDark bg-white px-3 py-2 text-sm outline-none focus:border-tgold focus:ring-2 focus:ring-tgold/30"
            />
          </label>
        </div>
      </Card>

      <Card title="Template">
        <style>{`@keyframes tmplPop{0%{transform:scale(0) rotate(-30deg);opacity:0}70%{transform:scale(1.25) rotate(0)}100%{transform:scale(1);opacity:1}}`}</style>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKER_TEMPLATES.map((t) => {
            const active = theme === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                title={t.name}
                className={
                  "group relative overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-300 ease-out " +
                  (active
                    ? "scale-[1.03] border-tgold bg-tcream shadow-md ring-2 ring-tgold/40"
                    : "border-tcreamDark hover:-translate-y-0.5 hover:border-tgold/60 hover:shadow-sm")
                }
              >
                {/* colour swatch preview */}
                <div className="mb-2 flex h-9 overflow-hidden rounded-md ring-1 ring-black/5">
                  <span className="flex-1 transition-transform duration-500 group-hover:scale-110" style={{ background: t.swatch[0] }} />
                  <span className="w-1/3 transition-transform duration-500 group-hover:scale-110" style={{ background: t.swatch[1] }} />
                </div>
                <span className="block text-sm font-bold text-tnavy">{t.name}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slate">{t.desc}</span>
                {active && (
                  <span
                    className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-tgold text-[11px] font-bold text-white shadow"
                    style={{ animation: "tmplPop .28s ease-out" }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate">Applies to the daily tax invoice, the weekly statement, and the SoA bundle PDFs.</p>
      </Card>

      <Card title="Invoice header">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setHeader({ style: "drawn" })}
            className={
              "rounded-lg border p-3 text-left text-sm transition " +
              (header.style === "drawn" ? "border-tgold bg-tcream ring-2 ring-tgold/30" : "border-tcreamDark hover:border-tgold/50")
            }
          >
            <span className="block font-semibold text-tnavy">Drawn header</span>
            <span className="text-xs text-slate">Built-in navy/gold Bait Al Madina header &amp; footer.</span>
          </button>
          <button
            type="button"
            onClick={() => setHeader({ style: "letterhead" })}
            className={
              "rounded-lg border p-3 text-left text-sm transition " +
              (header.style === "letterhead" ? "border-tgold bg-tcream ring-2 ring-tgold/30" : "border-tcreamDark hover:border-tgold/50")
            }
          >
            <span className="block font-semibold text-tnavy">Use my letterhead</span>
            <span className="text-xs text-slate">Print invoices on a saved letterhead image.</span>
          </button>
        </div>

        {header.style === "letterhead" && (
          <div className="mt-3">
            {letterheads.length === 0 ? (
              <p className="text-xs text-slate">
                No saved letterheads yet. Upload one in the main <span className="font-semibold text-tnavy">Studio</span> (Letterhead panel) and it will appear here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {letterheads.map((l) => {
                  const active = l.id === header.letterheadId;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setHeader({ letterheadId: l.id })}
                      title={l.name}
                      className={
                        "w-24 overflow-hidden rounded-lg border bg-white transition " +
                        (active ? "border-tgold ring-2 ring-tgold/40" : "border-tcreamDark hover:border-tgold/60")
                      }
                    >
                      <img src={l.dataUrl} alt={l.name} className="block h-28 w-full object-cover object-top" />
                      <span className="block truncate px-1.5 py-1 text-[10px] text-slate">{l.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-lg bg-tnavy px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-tnavy/90"
        >
          Save settings
        </button>
        {saved && <span className="text-sm font-semibold text-green-700">Saved ✓</span>}
      </div>
    </div>
  );
}
