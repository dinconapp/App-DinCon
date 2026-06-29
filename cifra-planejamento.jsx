import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, ArrowLeftRight, Receipt, User, LogOut, Plus, X,
  ChevronLeft, ChevronRight, Trash2, Pencil, Check, Clock, Trophy,
  Home, Zap, Wifi, HeartPulse, ShoppingCart, Bus, Coffee, CircleDollarSign,
  Banknote, Sparkles, TrendingUp, TrendingDown, PiggyBank, RotateCcw, Target,
  Landmark, GraduationCap, CalendarRange, Info, Wallet, LineChart, Search,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const nf = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (n) => nf.format(n ?? 0);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const parts = (n) => {
  const neg = n < 0;
  const [int, dec] = nf.format(Math.abs(n ?? 0)).split(",");
  return { int: (neg ? "-" : "") + int, dec };
};
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MES_CURTO = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const monthLabel = (key) => { const [y, m] = key.split("-"); return `${MESES[+m - 1]} ${y}`; };
const monthShort = (key) => { if (!key) return "—"; const [y, m] = key.split("-"); return `${MES_CURTO[+m - 1]}/${y.slice(2)}`; };
const monthInRange = (key, start, end) => {
  if (start && key < start) return false;
  if (end && key > end) return false;
  return true;
};
const shiftMonth = (key, delta) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const recentMonths = (key, n) => {
  const [y, m] = key.split("-").map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
};
const monthsBetween = (a, b) => {
  const [ay, am] = a.split("-").map(Number), [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
};
const sum = (arr) => arr.reduce((a, t) => a + t.amount, 0);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */
const EXP_CATS = {
  financiamento: { label: "Financiamento", icon: Landmark,        color: "#9D8BFF" },
  moradia:       { label: "Moradia",       icon: Home,            color: "#FF7A85" },
  energia:       { label: "Energia",       icon: Zap,             color: "#F4C25A" },
  internet:      { label: "Internet",      icon: Wifi,            color: "#5BC0EB" },
  saude:         { label: "Saúde",         icon: HeartPulse,      color: "#FF8FB1" },
  mercado:       { label: "Mercado",       icon: ShoppingCart,    color: "#34E0A1" },
  transporte:    { label: "Transporte",    icon: Bus,             color: "#6FD3C9" },
  educacao:      { label: "Educação",      icon: GraduationCap,   color: "#B69CFF" },
  lazer:         { label: "Lazer",         icon: Coffee,          color: "#FFA46B" },
  outros:        { label: "Outros",        icon: CircleDollarSign,color: "#9AA3B2" },
};
const INC_CATS = {
  salario:       { label: "Salário",       icon: Banknote,         color: "#34E0A1" },
  extra:         { label: "Renda extra",   icon: Sparkles,         color: "#7CE7C0" },
  investimentos: { label: "Investimentos", icon: TrendingUp,       color: "#5BC0EB" },
  outros:        { label: "Outros",        icon: CircleDollarSign, color: "#9AA3B2" },
};
const catOf = (t) => (t.kind === "income" ? INC_CATS : EXP_CATS)[t.category] || EXP_CATS.outros;

/* ------------------------------------------------------------------ */
/*  Seed                                                               */
/* ------------------------------------------------------------------ */
const BASE_MONTH = "2026-06"; // "hoje": antes disso é realizado; depois é previsão pelo plano
const SEED = {
  profile: { name: "Daniel", initial: "D" },
  accumulated: 15000, // saldo no INÍCIO do mês base
  closedMonths: { "2026-01": 1200, "2026-02": 2100, "2026-03": 900, "2026-04": 2400, "2026-05": 1600 },
  budgets: [
    { id: "b1", description: "Financiamento do apê", kind: "expense", category: "financiamento", type: "fixed", amount: 1200,  startMonth: "2026-01", endMonth: "2056-01", hasDueDate: true,  dueDay: 10 },
    { id: "b2", description: "Internet 600 MB",       kind: "expense", category: "internet",      type: "fixed", amount: 99.90, startMonth: "2026-01", endMonth: null,        hasDueDate: true,  dueDay: 15 },
    { id: "b3", description: "Energia elétrica",      kind: "expense", category: "energia",       type: "fixed", amount: 250,   startMonth: "2026-01", endMonth: null,        hasDueDate: true,  dueDay: 10 },
    { id: "b4", description: "Plano de saúde",        kind: "expense", category: "saude",         type: "fixed", amount: 350,   startMonth: "2026-01", endMonth: null,        hasDueDate: true,  dueDay: 18 },
    { id: "b5", description: "Mercado do mês",        kind: "expense", category: "mercado",       type: "fixed", amount: 1500,  startMonth: "2026-01", endMonth: "2026-12",   hasDueDate: false, dueDay: null },
    { id: "b6", description: "Combustível / transporte", kind: "expense", category: "transporte", type: "fixed", amount: 300,  startMonth: "2026-01", endMonth: null,        hasDueDate: false, dueDay: null },
    { id: "b8", description: "Lazer e rolês",         kind: "expense", category: "lazer",         type: "variable", amount: 400, startMonth: null,    endMonth: null,        hasDueDate: false, dueDay: null },
    { id: "b7", description: "Salário CLT",           kind: "income",  category: "salario",       type: "fixed", amount: 3500,  startMonth: "2026-01", endMonth: null,        hasDueDate: false, dueDay: 5 },
    { id: "b9", description: "Renda fixa PJ",         kind: "income",  category: "extra",         type: "fixed", amount: 2800,  startMonth: "2026-01", endMonth: null,        hasDueDate: false, dueDay: 20 },
  ],
  transactions: [
    // entradas reais do mês (dois trabalhos + extra)
    { id: "i1", kind: "income",  title: "Salário CLT",     category: "salario", amount: 3500, date: "2026-06-05", status: "paid" },
    { id: "i2", kind: "income",  title: "Renda PJ",        category: "extra",   amount: 2800, date: "2026-06-20", status: "paid" },
    { id: "i3", kind: "income",  title: "Freelance extra", category: "extra",   amount: 540,  date: "2026-06-12", status: "paid" },
    // contas fixas já pagas (geram gasto via budgetId)
    { id: "p1", kind: "expense", title: "Financiamento do apê", category: "financiamento", amount: 1200, date: "2026-06-10", status: "paid", budgetId: "b1" },
    { id: "p2", kind: "expense", title: "Internet 600 MB",      category: "internet",      amount: 99.90, date: "2026-06-15", status: "paid", budgetId: "b2" },
    { id: "p3", kind: "expense", title: "Energia elétrica",     category: "energia",       amount: 250,   date: "2026-06-10", status: "paid", budgetId: "b3" },
    // gastos reais no envelope Mercado
    { id: "m1", kind: "expense", title: "Pão de Açúcar",  category: "mercado", amount: 215.40, date: "2026-06-08", status: "paid" },
    { id: "m2", kind: "expense", title: "Hortifruti",     category: "mercado", amount: 90,     date: "2026-06-13", status: "paid" },
    { id: "m3", kind: "expense", title: "Compra rápida",  category: "mercado", amount: 50,     date: "2026-06-17", status: "paid" },
    // gastos variáveis com descrição (categorias sem orçamento fixo)
    { id: "v1", kind: "expense", title: "Coxinha da padaria",    category: "outros", amount: 8.50,  date: "2026-06-14", status: "paid" },
    { id: "v2", kind: "expense", title: "Cinema com a galera",   category: "lazer",  amount: 45,    date: "2026-06-15", status: "paid" },
    { id: "v3", kind: "expense", title: "Presente de aniversário", category: "outros", amount: 120, date: "2026-06-16", status: "paid" },
  ],
};

const HAS_STORE = typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";
const KEY = "cifra.v3";

/* ------------------------------------------------------------------ */
/*  Count-up                                                           */
/* ------------------------------------------------------------------ */
function useCountUp(target) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVal(target); prev.current = target; return; }
    const from = prev.current, to = target, start = performance.now(), dur = 600;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick); else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}
function Money({ value, size = "md", animate = false, prefix = "R$" }) {
  const live = animate ? useCountUp(value) : value;
  const { int, dec } = parts(live);
  return (
    <span className={`cf-money cf-money-${size}`}>
      <span className="cf-cur">{prefix}</span>
      <span className="cf-int">{int}</span>
      <span className="cf-dec">,{dec}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI                                                                */
/* ------------------------------------------------------------------ */
function Kpi({ eyebrow, value, accent, chip, icon: Icon, progress, badge }) {
  return (
    <div className="cf-kpi" style={{ "--k": accent }}>
      <div className="cf-kpi-top">
        <span className="cf-eyebrow">{eyebrow}{badge && <em className="cf-prev-tag">{badge}</em>}</span>
        <span className="cf-kpi-ico"><Icon size={15} strokeWidth={2.4} /></span>
      </div>
      <div className="cf-kpi-val"><Money value={value} size="lg" animate /></div>
      {progress && (
        <div className="cf-kpi-bar"><span style={{ width: `${Math.min(100, progress.value)}%`, background: progress.color }} /></div>
      )}
      {chip && <div className="cf-kpi-chip">{chip}</div>}
      <span className="cf-kpi-rail" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Charts                                                             */
/* ------------------------------------------------------------------ */
function AreaTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return <div className="cf-tip"><div className="cf-tip-lab">{label}</div><div className="cf-tip-val"><Money value={payload[0].value} size="sm" /></div></div>;
}
function EconomiaChart({ data }) {
  return (
    <div className="cf-chartbox">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
          <defs>
            <linearGradient id="ecoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34E0A1" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#34E0A1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" tick={{ fill: "#5C6573", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} dy={4} />
          <YAxis hide domain={[0, "dataMax + 400"]} />
          <Tooltip content={<AreaTip />} cursor={{ stroke: "rgba(255,255,255,.14)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="economia" stroke="#34E0A1" strokeWidth={2.4} fill="url(#ecoFill)" dot={{ r: 2.5, fill: "#0A0D12", stroke: "#34E0A1", strokeWidth: 2 }} activeDot={{ r: 4.5, fill: "#34E0A1", stroke: "#0A0D12", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function SaldoChart({ data }) {
  return (
    <div className="cf-chartbox">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9D8BFF" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#9D8BFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" tick={{ fill: "#5C6573", fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} dy={4} interval={0} />
          <YAxis hide domain={["dataMin - 1500", "dataMax + 1500"]} />
          <Tooltip content={<AreaTip />} cursor={{ stroke: "rgba(255,255,255,.14)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="saldo" stroke="#B5A6FF" strokeWidth={2.4} fill="url(#saldoFill)" dot={{ r: 2.4, fill: "#0A0D12", stroke: "#B5A6FF", strokeWidth: 1.8 }} activeDot={{ r: 4.5, fill: "#B5A6FF", stroke: "#0A0D12", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function DonutTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return <div className="cf-tip"><div className="cf-tip-lab" style={{ color: p.payload.color }}>{p.name}</div><div className="cf-tip-val"><Money value={p.value} size="sm" /></div></div>;
}

/* ------------------------------------------------------------------ */
/*  Rows                                                               */
/* ------------------------------------------------------------------ */
function BudgetRow({ b, gasto, projected }) {
  const c = catOf({ kind: b.kind, category: b.category });
  const Icon = c.icon;
  const pct = b.amount > 0 ? (gasto / b.amount) * 100 : 0;
  const over = gasto > b.amount + 0.001;
  return (
    <div className="cf-brow">
      <span className="cf-cat" style={{ "--c": c.color }}><Icon size={16} strokeWidth={2.2} /></span>
      <div className="cf-brow-main">
        <div className="cf-brow-head">
          <span className="cf-brow-title">{b.description}{b.hasDueDate && <em className="cf-due">vence dia {b.dueDay}</em>}</span>
          {projected
            ? <span className="cf-brow-vals"><i>previsto</i> <b>{fmt(b.amount)}</b></span>
            : <span className="cf-brow-vals"><b className={over ? "over" : (gasto > 0 ? "" : "zero")}>{fmt(gasto)}</b> <i>/ {fmt(b.amount)}</i></span>}
        </div>
        <div className="cf-bar"><span className="cf-bar-fill" style={{ width: projected ? "100%" : `${Math.min(100, pct)}%`, background: over ? "var(--expense)" : c.color, opacity: projected ? .32 : .85 }} /></div>
      </div>
      {projected ? <span className="cf-pct prev">plano</span> : <span className={`cf-pct ${over ? "over" : ""}`}>{Math.round(pct)}%</span>}
    </div>
  );
}
function VarRow({ t, onEdit, onDelete }) {
  const c = catOf(t);
  const Icon = c.icon;
  return (
    <div className="cf-row">
      <span className="cf-cat" style={{ "--c": c.color }}><Icon size={16} strokeWidth={2.2} /></span>
      <div className="cf-row-main2">
        <span className="cf-row-title">{t.title}</span>
        <span className="cf-row-sub">{c.label} · dia {t.date.slice(8)}</span>
      </div>
      <span className="cf-row-amt2"><Money value={t.amount} size="sm" /></span>
      <div className="cf-row-acts">
        <button className="cf-icbtn" onClick={onEdit} aria-label="Editar"><Pencil size={14} /></button>
        <button className="cf-icbtn" onClick={onDelete} aria-label="Remover"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}
function IncomeRow({ t, planned, onEdit, onDelete }) {
  const c = catOf({ kind: "income", category: t.category });
  const Icon = c.icon;
  return (
    <div className="cf-row">
      <span className="cf-cat" style={{ "--c": c.color }}><Icon size={16} strokeWidth={2.2} /></span>
      <div className="cf-row-main2">
        <span className="cf-row-title">{t.title}</span>
        <span className="cf-row-sub">{c.label}{planned ? " · previsto" : (t.date ? ` · dia ${t.date.slice(8)}` : "")}</span>
      </div>
      <span className="cf-row-amt2 g"><Money value={t.amount} size="sm" /></span>
      {planned
        ? <span className="cf-prev-pill">plano</span>
        : <div className="cf-row-acts">
            <button className="cf-icbtn" onClick={onEdit} aria-label="Editar"><Pencil size={14} /></button>
            <button className="cf-icbtn" onClick={onDelete} aria-label="Remover"><Trash2 size={14} /></button>
          </div>}
    </div>
  );
}
function MetaRow({ b }) {
  const c = catOf({ kind: b.kind, category: b.category });
  const Icon = c.icon;
  return (
    <div className="cf-row">
      <span className="cf-cat" style={{ "--c": c.color }}><Icon size={16} strokeWidth={2.2} /></span>
      <div className="cf-row-main2"><span className="cf-row-title">{b.description}</span><span className="cf-row-sub">meta mensal</span></div>
      <span className="cf-row-amt2"><Money value={b.amount} size="sm" /></span>
      <span className="cf-prev-pill">meta</span>
    </div>
  );
}
function BillRow({ b, paid, onToggle }) {
  const c = catOf({ kind: "expense", category: b.category });
  return (
    <div className="cf-bill">
      <button className={`cf-check ${paid ? "on" : ""}`} onClick={onToggle} aria-label={paid ? "Marcar como pendente" : "Marcar como paga"}>
        {paid ? <Check size={13} strokeWidth={3} /> : <Clock size={12} strokeWidth={2.4} />}
      </button>
      <div className="cf-bill-main">
        <span className={`cf-bill-title ${paid ? "done" : ""}`}>{b.description}</span>
        <span className="cf-bill-meta">{c.label} · vence dia {b.dueDay}</span>
      </div>
      <span className={`cf-bill-amt ${paid ? "g" : "p"}`}><Money value={b.amount} size="sm" /></span>
    </div>
  );
}
function PlanRow({ b, onEdit, onDelete }) {
  const c = catOf({ kind: b.kind, category: b.category });
  const Icon = c.icon;
  const period = b.startMonth ? `${monthShort(b.startMonth)} – ${b.endMonth ? monthShort(b.endMonth) : "sem fim"}` : "—";
  return (
    <div className="cf-plan-row">
      <span className="cf-cat" style={{ "--c": c.color }}><Icon size={17} strokeWidth={2.2} /></span>
      <div className="cf-plan-desc">
        <span className="cf-plan-title">{b.description}</span>
        <span className="cf-plan-cat">{c.label}{b.kind === "income" ? " · entrada" : ""}</span>
      </div>
      <span className="cf-plan-amt"><Money value={b.amount} size="sm" /><em>/mês</em></span>
      <div className="cf-plan-meta">
        {b.type === "fixed" ? (
          <>
            <span className="cf-tag period"><CalendarRange size={12} /> {period}</span>
            <span className={`cf-tag ${b.hasDueDate ? "due" : "nodue"}`}>{b.hasDueDate ? `vence dia ${b.dueDay}` : "não vence"}</span>
          </>
        ) : <span className="cf-tag var">variável · sem período</span>}
      </div>
      <div className="cf-row-acts always">
        <button className="cf-icbtn" onClick={onEdit} aria-label="Editar"><Pencil size={14} /></button>
        <button className="cf-icbtn" onClick={onDelete} aria-label="Remover"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Panel                                                              */
/* ------------------------------------------------------------------ */
function Panel({ title, meta, children, accent, action }) {
  return (
    <section className="cf-panel">
      <header className="cf-panel-head">
        <h3 className="cf-panel-title">{accent && <span className="cf-dot" style={{ background: accent }} />}{title}</h3>
        {action || (meta && <span className="cf-panel-meta">{meta}</span>)}
      </header>
      <div className="cf-panel-body">{children}</div>
    </section>
  );
}
function Empty({ children }) { return <div className="cf-empty">{children}</div>; }

/* ------------------------------------------------------------------ */
/*  Transaction modal                                                  */
/* ------------------------------------------------------------------ */
function TxModal({ initial, monthKey, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const defDate = today.startsWith(monthKey) ? today : `${monthKey}-15`;
  const [f, setF] = useState(initial || { kind: "expense", title: "", category: "mercado", amount: "", date: defDate });
  const cats = f.kind === "income" ? INC_CATS : EXP_CATS;
  const set = (p) => setF((s) => ({ ...s, ...p }));
  const setKind = (kind) => set({ kind, category: Object.keys(kind === "income" ? INC_CATS : EXP_CATS)[0] });
  const valid = f.title.trim() && Number(f.amount) > 0 && f.date;
  const submit = () => { if (!valid) return; onSave({ ...f, title: f.title.trim(), amount: round2(Number(f.amount)), status: "paid", id: f.id || uid() }); };
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="cf-overlay" onMouseDown={onClose}>
      <div className="cf-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <header className="cf-dialog-head"><h3>{f.id ? "Editar transação" : "Nova transação"}</h3><button className="cf-icbtn" onClick={onClose}><X size={18} /></button></header>
        <div className="cf-seg cf-seg-kind">
          <button className={f.kind === "income" ? "on g" : ""} onClick={() => setKind("income")}>Entrada</button>
          <button className={f.kind === "expense" ? "on r" : ""} onClick={() => setKind("expense")}>Gasto</button>
        </div>
        <label className="cf-field"><span>Descrição</span>
          <input value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex.: Coxinha, Mercado, Salário" autoFocus /></label>
        <div className="cf-field-row">
          <label className="cf-field"><span>Valor</span>
            <div className="cf-input-pre"><i>R$</i><input type="number" step="0.01" min="0" inputMode="decimal" value={f.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0,00" /></div></label>
          <label className="cf-field"><span>Data</span><input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></label>
        </div>
        <label className="cf-field"><span>Categoria</span>
          <select value={f.category} onChange={(e) => set({ category: e.target.value })}>
            {Object.entries(cats).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select></label>
        {f.kind === "expense" && (
          <p className="cf-modal-hint"><Info size={13} /> Categorias com orçamento fixo entram nos <b>Gastos fixos</b>. As demais vão para <b>Variáveis</b> com a descrição.</p>
        )}
        <footer className="cf-dialog-foot">
          <button className="cf-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="cf-btn" onClick={submit} disabled={!valid}>{f.id ? "Salvar" : "Adicionar"}</button>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Budget modal (Planejamento)                                        */
/* ------------------------------------------------------------------ */
function budgetToForm(b) {
  return { ...b, amount: String(b.amount), noEnd: !b.endMonth, endMonth: b.endMonth || "", dueDay: b.dueDay != null ? String(b.dueDay) : "" };
}
function BudgetModal({ initial, monthKey, onClose, onSave }) {
  const [f, setF] = useState(initial || {
    kind: "expense", type: "fixed", description: "", category: "moradia", amount: "",
    startMonth: monthKey, endMonth: "", noEnd: true, hasDueDate: false, dueDay: "",
  });
  const cats = f.kind === "income" ? INC_CATS : EXP_CATS;
  const set = (p) => setF((s) => ({ ...s, ...p }));
  const setKind = (kind) => set({ kind, category: Object.keys(kind === "income" ? INC_CATS : EXP_CATS)[0] });
  const fixed = f.type === "fixed";
  const valid =
    f.description.trim() && Number(f.amount) > 0 &&
    (!fixed || f.startMonth) &&
    (!fixed || f.noEnd || f.endMonth) &&
    (!fixed || !f.hasDueDate || (Number(f.dueDay) >= 1 && Number(f.dueDay) <= 31));
  const submit = () => {
    if (!valid) return;
    onSave({
      id: f.id || uid(), kind: f.kind, type: f.type, description: f.description.trim(),
      category: f.category, amount: round2(Number(f.amount)),
      startMonth: fixed ? f.startMonth : null,
      endMonth: fixed ? (f.noEnd ? null : f.endMonth) : null,
      hasDueDate: fixed ? !!f.hasDueDate : false,
      dueDay: fixed && f.hasDueDate ? Number(f.dueDay) : null,
    });
  };
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="cf-overlay" onMouseDown={onClose}>
      <div className="cf-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <header className="cf-dialog-head"><h3>{f.id ? "Editar item do plano" : "Novo item do plano"}</h3><button className="cf-icbtn" onClick={onClose}><X size={18} /></button></header>

        <div className="cf-seg cf-seg-kind">
          <button className={f.kind === "expense" ? "on r" : ""} onClick={() => setKind("expense")}>Gasto</button>
          <button className={f.kind === "income" ? "on g" : ""} onClick={() => setKind("income")}>Entrada</button>
        </div>

        <label className="cf-field"><span>Descrição</span>
          <input value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="Ex.: Financiamento do apê, Mercado do mês" autoFocus /></label>

        <div className="cf-field-row">
          <label className="cf-field"><span>Categoria</span>
            <select value={f.category} onChange={(e) => set({ category: e.target.value })}>
              {Object.entries(cats).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
            </select></label>
          <label className="cf-field"><span>Orçamento</span>
            <div className="cf-input-pre"><i>R$</i><input type="number" step="0.01" min="0" inputMode="decimal" value={f.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0,00" /><u>/mês</u></div></label>
        </div>

        <label className="cf-field"><span>Tipo</span>
          <div className="cf-seg">
            <button className={fixed ? "on" : ""} onClick={() => set({ type: "fixed" })}>Conta fixa</button>
            <button className={!fixed ? "on" : ""} onClick={() => set({ type: "variable" })}>Variável</button>
          </div></label>

        {fixed && (
          <div className="cf-fixed-block">
            <div className="cf-field-row">
              <label className="cf-field"><span>Mês de início</span>
                <input type="month" value={f.startMonth} onChange={(e) => set({ startMonth: e.target.value })} /></label>
              <label className="cf-field"><span>Mês de término</span>
                <input type="month" value={f.endMonth} disabled={f.noEnd} onChange={(e) => set({ endMonth: e.target.value })} className={f.noEnd ? "disabled" : ""} /></label>
            </div>
            <label className="cf-checkrow">
              <input type="checkbox" checked={f.noEnd} onChange={(e) => set({ noEnd: e.target.checked })} />
              <span>Sem data de término (recorrente)</span>
            </label>
            <label className="cf-checkrow">
              <input type="checkbox" checked={f.hasDueDate} onChange={(e) => set({ hasDueDate: e.target.checked })} />
              <span>Esta conta tem vencimento (vira conta a pagar)</span>
            </label>
            {f.hasDueDate && (
              <label className="cf-field cf-dueday"><span>Dia do vencimento</span>
                <input type="number" min="1" max="31" value={f.dueDay} onChange={(e) => set({ dueDay: e.target.value })} placeholder="ex.: 10" /></label>
            )}
          </div>
        )}

        {!fixed && <p className="cf-modal-hint"><Info size={13} /> Itens variáveis não têm datas. Servem como meta mensal e os gastos avulsos aparecem nos <b>Variáveis</b>.</p>}

        <footer className="cf-dialog-foot">
          <button className="cf-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="cf-btn" onClick={submit} disabled={!valid}>{f.id ? "Salvar" : "Adicionar ao plano"}</button>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */
export default function App() {
  const [view, setView] = useState("dashboard");
  const [monthKey, setMonthKey] = useState("2026-06");
  const [data, setData] = useState(SEED);
  const [editingTx, setEditingTx] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [toast, setToast] = useState(null);
  const [txSearch, setTxSearch] = useState("");
  const [txKind, setTxKind] = useState("all");
  const [txCat, setTxCat] = useState("all");
  const [loaded, setLoaded] = useState(false);

  /* persistence */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (HAS_STORE) { try { const r = await window.storage.get(KEY); if (alive && r && r.value) setData(JSON.parse(r.value)); } catch (e) {} }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (loaded && HAS_STORE) window.storage.set(KEY, JSON.stringify(data)).catch(() => {}); }, [data, loaded]);

  const notify = (msg) => setToast({ msg, id: uid() });
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); }, [toast]);

  /* mutations */
  const saveTx = (tx) => {
    setData((d) => { const ex = d.transactions.some((t) => t.id === tx.id); return { ...d, transactions: ex ? d.transactions.map((t) => t.id === tx.id ? tx : t) : [...d.transactions, tx] }; });
    notify(editingTx && editingTx !== "new" ? "Transação atualizada" : "Transação adicionada"); setEditingTx(null);
  };
  const delTx = (id) => { setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) })); notify("Transação removida"); };
  const saveBudget = (b) => {
    setData((d) => { const ex = d.budgets.some((x) => x.id === b.id); return { ...d, budgets: ex ? d.budgets.map((x) => x.id === b.id ? b : x) : [...d.budgets, b] }; });
    notify(editingBudget && editingBudget !== "new" ? "Plano atualizado" : "Adicionado ao plano"); setEditingBudget(null);
  };
  const delBudget = (id) => {
    if (!confirm("Remover este item do plano? Ele deixará de alimentar os meses.")) return;
    setData((d) => ({ ...d, budgets: d.budgets.filter((x) => x.id !== id), transactions: d.transactions.filter((t) => t.budgetId !== id) }));
    notify("Item removido");
  };
  const resetAll = () => { if (confirm("Restaurar os dados de exemplo?")) { setData(SEED); notify("Dados restaurados"); } };

  /* ---- economia / saldo helpers (projeção) ---- */
  const realizedEconomiaOf = (key) => {
    const txs = data.transactions.filter((t) => t.date.startsWith(key));
    return sum(txs.filter((t) => t.kind === "income")) - sum(txs.filter((t) => t.kind === "expense"));
  };
  const plannedIncomeOf = (key) => data.budgets.filter((b) => b.kind === "income" && (b.type === "variable" || monthInRange(key, b.startMonth, b.endMonth))).reduce((a, b) => a + b.amount, 0);
  const plannedExpenseOf = (key) => data.budgets.filter((b) => b.kind === "expense" && (b.type === "variable" || monthInRange(key, b.startMonth, b.endMonth))).reduce((a, b) => a + b.amount, 0);
  const economiaOf = (key) => {
    if (key > BASE_MONTH) return plannedIncomeOf(key) - plannedExpenseOf(key);
    if (key === BASE_MONTH) return realizedEconomiaOf(key);
    if (data.closedMonths[key] != null) return data.closedMonths[key];
    return realizedEconomiaOf(key);
  };
  const saldoFimOf = (key) => {
    let total = data.accumulated;
    const diff = monthsBetween(BASE_MONTH, key);
    if (diff >= 0) { let m = BASE_MONTH; for (let i = 0; i <= diff; i++) { total += economiaOf(m); m = shiftMonth(m, 1); } }
    else { let m = shiftMonth(BASE_MONTH, -1); for (let i = 0; i < (-diff - 1); i++) { total -= economiaOf(m); m = shiftMonth(m, -1); } }
    return round2(total);
  };

  /* ---- derived for displayed month ---- */
  const isProjected = monthKey > BASE_MONTH;
  const isPast = monthKey < BASE_MONTH;
  const inMonth = (t) => t.date.startsWith(monthKey);
  const monthTx = useMemo(() => data.transactions.filter(inMonth), [data, monthKey]);
  const incomeTx = monthTx.filter((t) => t.kind === "income");
  const expenseTx = monthTx.filter((t) => t.kind === "expense");

  const activeFixedExp = data.budgets.filter((b) => b.kind === "expense" && b.type === "fixed" && monthInRange(monthKey, b.startMonth, b.endMonth)).sort((a, b) => b.amount - a.amount);
  const activeVarExp = data.budgets.filter((b) => b.kind === "expense" && b.type === "variable");
  const incomeBudgets = data.budgets.filter((b) => b.kind === "income" && (b.type === "variable" || monthInRange(monthKey, b.startMonth, b.endMonth)));
  const fixedCats = new Set(activeFixedExp.map((b) => b.category));

  const gastoOfCat = (cat) => expenseTx.filter((t) => t.category === cat).reduce((a, t) => a + t.amount, 0);
  const varTx = expenseTx.filter((t) => !fixedCats.has(t.category)).sort((a, b) => b.date.localeCompare(a.date));

  const realIncome = sum(incomeTx);
  const realExpense = sum(expenseTx);
  const orcadoFixo = activeFixedExp.reduce((a, b) => a + b.amount, 0);
  const orcadoVar = activeVarExp.reduce((a, b) => a + b.amount, 0);
  const orcadoTotal = orcadoFixo + orcadoVar;
  const orcadoRenda = incomeBudgets.reduce((a, b) => a + b.amount, 0);
  const gastoFixo = expenseTx.filter((t) => fixedCats.has(t.category)).reduce((a, t) => a + t.amount, 0);
  const gastoVar = sum(varTx);

  // realizado (passado/atual) ou previsto pelo plano (futuro)
  const dispIncome = isProjected ? orcadoRenda : realIncome;
  const dispExpense = isProjected ? orcadoTotal : realExpense;
  const dispEconomia = round2(dispIncome - dispExpense);
  const dispRate = dispIncome > 0 ? Math.round((dispEconomia / dispIncome) * 100) : 0;
  const saldoFim = saldoFimOf(monthKey);
  const economiaMes = economiaOf(monthKey);

  const bills = activeFixedExp.filter((b) => b.hasDueDate);
  const isBillPaid = (b) => data.transactions.some((t) => t.budgetId === b.id && t.date.startsWith(monthKey) && t.status === "paid");
  const pendingBills = bills.filter((b) => !isBillPaid(b)).sort((a, b) => (a.dueDay || 0) - (b.dueDay || 0));
  const paidBills = bills.filter(isBillPaid);
  const pendingTotal = pendingBills.reduce((a, b) => a + b.amount, 0);

  const toggleBill = (b) => {
    if (isBillPaid(b)) {
      setData((d) => ({ ...d, transactions: d.transactions.filter((t) => !(t.budgetId === b.id && t.date.startsWith(monthKey))) }));
      notify("Conta marcada como pendente");
    } else {
      setData((d) => ({ ...d, transactions: [...d.transactions, { id: uid(), kind: "expense", title: b.description, category: b.category, amount: b.amount, date: `${monthKey}-${String(b.dueDay || 1).padStart(2, "0")}`, status: "paid", budgetId: b.id }] }));
      notify("Conta paga");
    }
  };

  /* ranking (dentro do ano exibido) */
  const year = monthKey.slice(0, 4);
  const ecoYear = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`).map((k) => [k, economiaOf(k)]).sort((a, b) => b[1] - a[1]);
  const rank = ecoYear.findIndex(([k]) => k === monthKey) + 1;
  const ordinal = ["", "1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º", "11º", "12º"][rank] || `${rank}º`;

  const byCat = useMemo(() => {
    const m = {};
    expenseTx.forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m).map(([k, v]) => ({ name: EXP_CATS[k]?.label || k, value: v, color: EXP_CATS[k]?.color || "#9AA3B2" })).sort((a, b) => b.value - a.value);
  }, [expenseTx]);

  /* filtros da aba Transações */
  const txCatsPresent = useMemo(() => {
    const seen = new Map();
    monthTx.forEach((t) => { if (!seen.has(t.category)) seen.set(t.category, catOf(t).label); });
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [monthTx]);
  const txFilterActive = txKind !== "all" || txCat !== "all" || txSearch.trim() !== "";
  const filteredTx = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return monthTx
      .filter((t) => (txKind === "all" || t.kind === txKind))
      .filter((t) => (txCat === "all" || t.category === txCat))
      .filter((t) => (!q || t.title.toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [monthTx, txKind, txCat, txSearch]);
  const filteredIncome = filteredTx.filter((t) => t.kind === "income").reduce((a, t) => a + t.amount, 0);
  const filteredExpense = filteredTx.filter((t) => t.kind === "expense").reduce((a, t) => a + t.amount, 0);

  /* projeção: gráfico (12 meses a partir de hoje) + marcos */
  const projChart = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const m = shiftMonth(BASE_MONTH, i);
    const mm = +m.split("-")[1];
    return { name: mm === 1 ? `${MES_CURTO[0]}/${m.slice(2, 4)}` : MES_CURTO[mm - 1], saldo: saldoFimOf(m) };
  }), [data]);
  const milestones = [
    { label: "Fim deste mês", key: BASE_MONTH },
    { label: "Em 6 meses", key: shiftMonth(BASE_MONTH, 6) },
    { label: "Em 1 ano", key: shiftMonth(BASE_MONTH, 12) },
    { label: "Em 5 anos", key: shiftMonth(BASE_MONTH, 60) },
  ].map((x) => ({ ...x, value: saldoFimOf(x.key), sub: monthLabel(x.key) }));

  const ganhoItems = isProjected ? incomeBudgets : incomeTx;

  /* planning page grouping */
  const fixedBudgets = data.budgets.filter((b) => b.type === "fixed");
  const variableBudgets = data.budgets.filter((b) => b.type === "variable");

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "plano", label: "Planejamento", icon: Target },
    { id: "transacoes", label: "Transações", icon: ArrowLeftRight },
    { id: "contas", label: "Contas", icon: Receipt },
    { id: "perfil", label: "Perfil", icon: User },
  ];

  return (
    <div className="cf-root">
      <style>{CSS}</style>

      <aside className="cf-side">
        <div className="cf-brand"><span className="cf-mark">C</span><div className="cf-brand-txt"><b>Cifra</b><i>controle financeiro</i></div></div>
        <nav className="cf-nav">
          {NAV.map((n) => (
            <button key={n.id} className={`cf-navitem ${view === n.id ? "on" : ""}`} onClick={() => setView(n.id)}>
              <n.icon size={18} strokeWidth={2.1} /><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="cf-side-foot">
          <button className="cf-navitem danger" onClick={() => notify("Sessão encerrada (demo)")}><LogOut size={18} strokeWidth={2.1} /><span>Sair</span></button>
          <div className="cf-user"><span className="cf-avatar">{data.profile.initial}</span><div className="cf-user-txt"><b>{data.profile.name}</b><i>Plano pessoal</i></div></div>
        </div>
      </aside>

      <main className="cf-main">
        <header className="cf-topbar">
          <div>
            <h1 className="cf-h1">
              {view === "dashboard" && "Visão geral"}
              {view === "plano" && "Planejamento"}
              {view === "transacoes" && "Transações"}
              {view === "contas" && "Contas"}
              {view === "perfil" && "Perfil"}
              {view === "dashboard" && isProjected && <span className="cf-prev-badge"><LineChart size={12} /> previsão</span>}
              {view === "dashboard" && isPast && <span className="cf-prev-badge past">mês fechado</span>}
            </h1>
            <p className="cf-sub">
              {view === "dashboard" && !isProjected && "Orçado vs. realizado, calculado a partir do seu plano."}
              {view === "dashboard" && isProjected && "Projeção pelo plano — assumindo que você siga o orçado."}
              {view === "plano" && "Cadastre uma vez. Alimenta dashboard, contas e transações."}
              {view === "transacoes" && "Cada entrada e saída do mês."}
              {view === "contas" && "Contas fixas que vencem neste mês."}
              {view === "perfil" && "Seus dados e preferências."}
            </p>
          </div>
          <div className="cf-topbar-acts">
            <div className="cf-monthnav">
              <button onClick={() => setMonthKey(shiftMonth(monthKey, -1))} aria-label="Mês anterior"><ChevronLeft size={17} /></button>
              <span>{monthLabel(monthKey)}</span>
              <button onClick={() => setMonthKey(shiftMonth(monthKey, 1))} aria-label="Próximo mês"><ChevronRight size={17} /></button>
            </div>
            {view === "plano"
              ? <button className="cf-btn" onClick={() => setEditingBudget("new")}><Plus size={17} strokeWidth={2.6} /><span>Novo item</span></button>
              : <button className="cf-btn" onClick={() => setEditingTx("new")}><Plus size={17} strokeWidth={2.6} /><span>Nova transação</span></button>}
          </div>
        </header>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <>
            <div className="cf-kpis">
              <Kpi eyebrow="Ganho" value={dispIncome} accent="#34E0A1" icon={TrendingUp} badge={isProjected ? "previsto" : null}
                chip={isProjected ? <span className="cf-chip g">{incomeBudgets.length} renda{incomeBudgets.length !== 1 ? "s" : ""} no plano</span>
                  : <span className="cf-chip g">{orcadoRenda > 0 ? `de ${fmt(orcadoRenda)} orçado` : `${incomeTx.length} entradas`}</span>} />
              <Kpi eyebrow="Gasto" value={dispExpense} accent="#FF7A85" icon={TrendingDown} badge={isProjected ? "previsto" : null}
                progress={{ value: isProjected ? 100 : (orcadoTotal > 0 ? (realExpense / orcadoTotal) * 100 : 0), color: "#FF7A85" }}
                chip={isProjected ? <span className="cf-chip r">100% do orçado</span> : <>
                  <span className="cf-chip r">de {fmt(orcadoTotal)} orçado</span>
                  {pendingTotal > 0 && <span className="cf-chip p">{fmt(pendingTotal)} a pagar</span>}
                </>} />
              <Kpi eyebrow="Economia" value={dispEconomia} accent="#7CE7C0" icon={PiggyBank} badge={isProjected ? "prevista" : null}
                chip={<span className="cf-chip g">{dispRate}% poupado</span>} />
              <Kpi eyebrow="Saldo acumulado" value={saldoFim} accent="#9D8BFF" icon={Banknote}
                chip={<span className="cf-chip v">{economiaMes >= 0 ? "+" : ""}{fmt(economiaMes)} {isProjected ? "previsto" : "no mês"}</span>} />
            </div>

            <div className="cf-grid2">
              <Panel title="Ganhos" accent="#34E0A1" meta={isProjected ? `R$ ${fmt(orcadoRenda)} previsto` : `R$ ${fmt(realIncome)}`}>
                {ganhoItems.length ? (isProjected
                  ? ganhoItems.map((b) => <IncomeRow key={b.id} t={{ title: b.description, category: b.category, amount: b.amount }} planned />)
                  : ganhoItems.map((t) => <IncomeRow key={t.id} t={t} onEdit={() => setEditingTx(t)} onDelete={() => delTx(t.id)} />))
                  : <Empty>{isPast ? "Mês sem entradas detalhadas." : "Cadastre suas rendas no Planejamento ou adicione uma entrada."}</Empty>}
              </Panel>

              <Panel title="Gastos fixos" accent="#FF7A85" meta={isProjected ? `R$ ${fmt(orcadoFixo)} previsto` : `R$ ${fmt(gastoFixo)} de ${fmt(orcadoFixo)}`}>
                {activeFixedExp.length ? activeFixedExp.map((b) => <BudgetRow key={b.id} b={b} gasto={gastoOfCat(b.category)} projected={isProjected} />)
                  : <Empty>Nenhuma conta fixa ativa neste mês. Cadastre no <b>Planejamento</b>.</Empty>}
              </Panel>
            </div>

            <div className="cf-grid2">
              <Panel title="Gastos variáveis" accent="#FFA46B" meta={isProjected ? `R$ ${fmt(orcadoVar)} meta` : (orcadoVar > 0 ? `R$ ${fmt(gastoVar)} de ${fmt(orcadoVar)}` : `R$ ${fmt(gastoVar)}`)}>
                {isProjected
                  ? (activeVarExp.length ? activeVarExp.map((b) => <MetaRow key={b.id} b={b} />) : <Empty>Sem metas variáveis no plano.</Empty>)
                  : (varTx.length ? varTx.map((t) => <VarRow key={t.id} t={t} onEdit={() => setEditingTx(t)} onDelete={() => delTx(t.id)} />)
                    : <Empty>Gastos fora das categorias fixas aparecem aqui com a descrição.</Empty>)}
              </Panel>

              <Panel title="Contas do mês" accent="#F4C25A" meta={pendingBills.length ? `R$ ${fmt(pendingTotal)} a pagar` : "tudo em dia"}>
                <div className="cf-sub-h">A pagar</div>
                {pendingBills.length ? pendingBills.map((b) => <BillRow key={b.id} b={b} paid={false} onToggle={() => toggleBill(b)} />)
                  : <p className="cf-mini-empty">Nenhuma conta pendente.</p>}
                <div className="cf-sub-h pad">Pagas</div>
                {paidBills.length ? paidBills.map((b) => <BillRow key={b.id} b={b} paid={true} onToggle={() => toggleBill(b)} />)
                  : <p className="cf-mini-empty">{isProjected ? "Nenhuma paga ainda (mês futuro)." : "Marque uma conta como paga."}</p>}
              </Panel>
            </div>

            <section className="cf-panel cf-proj">
              <header className="cf-panel-head">
                <h3 className="cf-panel-title"><span className="cf-dot" style={{ background: "#9D8BFF" }} />Projeção do saldo</h3>
                <span className="cf-panel-meta">se você seguir o orçado</span>
              </header>
              <div className="cf-panel-body">
                <div className="cf-milestones">
                  {milestones.map((m, i) => (
                    <div key={i} className={`cf-mile ${i === 0 ? "now" : ""}`}>
                      <span className="cf-mile-lab">{m.label}</span>
                      <Money value={m.value} size="md" />
                      <i>{m.sub}</i>
                    </div>
                  ))}
                </div>
                <SaldoChart data={projChart} />
                <p className="cf-proj-note"><Info size={12} /> Projeção a partir de {monthLabel(BASE_MONTH)}. Quando o <b>Mercado</b> terminar (Dez/2026), a sobra mensal aumenta — dá pra ver a curva subir mais forte a partir daí.</p>
              </div>
            </section>

            <div className="cf-grid2">
              <Panel title="Para onde foi o dinheiro" accent="#9D8BFF" meta={isProjected ? "previsão" : monthLabel(monthKey)}>
                {byCat.length ? (
                  <div className="cf-donut-wrap">
                    <div className="cf-donut">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={byCat} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={2} stroke="none">
                            {byCat.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip content={<DonutTip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="cf-donut-center"><b>{fmt(realExpense)}</b><i>total</i></div>
                    </div>
                    <ul className="cf-legend">
                      {byCat.slice(0, 5).map((d, i) => <li key={i}><span className="cf-leg-dot" style={{ background: d.color }} /><span className="cf-leg-lab">{d.name}</span><span className="cf-leg-val">{fmt(d.value)}</span></li>)}
                    </ul>
                  </div>
                ) : <Empty>{isProjected ? "Mês futuro — veja o orçado por categoria no Planejamento." : "Sem gastos realizados neste mês."}</Empty>}
              </Panel>

              <div className="cf-rankcard">
                <div className="cf-trophy"><Trophy size={20} strokeWidth={2.2} /></div>
                <div className="cf-rank-txt"><span className="cf-rank-pos">{ordinal} lugar</span><span className="cf-rank-cap">{isProjected ? "economia prevista em" : "mês mais econômico de"} {year}</span></div>
                <div className="cf-rank-eco"><Money value={economiaMes} size="sm" /><i>economia</i></div>
              </div>
            </div>
          </>
        )}

        {/* PLANEJAMENTO */}
        {view === "plano" && (
          <>
            <div className="cf-plan-banner">
              <Wallet size={18} strokeWidth={2.2} />
              <p>O que você cadastra aqui vira a base do mês. <b>Contas fixas</b> aparecem em todo mês do período (e em <b>Contas a pagar</b> se tiverem vencimento). O <b>orçamento</b> define a barra de cada categoria no Dashboard.</p>
            </div>

            <div className="cf-mini-cards">
              <div className="cf-mini" style={{ "--k": "#FF7A85" }}><span className="cf-eyebrow">Orçado fixo / mês</span><Money value={orcadoFixo} size="md" /><i>{activeFixedExp.length} conta{activeFixedExp.length !== 1 ? "s" : ""}</i></div>
              <div className="cf-mini" style={{ "--k": "#FFA46B" }}><span className="cf-eyebrow">Orçado variável</span><Money value={orcadoVar} size="md" /><i>meta mensal</i></div>
              <div className="cf-mini" style={{ "--k": "#34E0A1" }}><span className="cf-eyebrow">Renda planejada</span><Money value={orcadoRenda} size="md" /><i>entradas fixas</i></div>
              <div className="cf-mini" style={{ "--k": "#9D8BFF" }}><span className="cf-eyebrow">Sobra planejada</span><Money value={orcadoRenda - orcadoTotal} size="md" /><i>renda − orçado</i></div>
            </div>

            <Panel title="Contas fixas" accent="#9D8BFF" meta={`${fixedBudgets.length} item${fixedBudgets.length !== 1 ? "s" : ""}`}>
              {fixedBudgets.length ? fixedBudgets.map((b) => <PlanRow key={b.id} b={b} onEdit={() => setEditingBudget(budgetToForm(b))} onDelete={() => delBudget(b.id)} />)
                : <Empty>Cadastre seu financiamento, aluguel, internet, mercado…<br />Toque em <b>Novo item</b>.</Empty>}
            </Panel>

            <div style={{ height: 16 }} />

            <Panel title="Variáveis (metas)" accent="#FFA46B" meta={`${variableBudgets.length} item${variableBudgets.length !== 1 ? "s" : ""}`}>
              {variableBudgets.length ? variableBudgets.map((b) => <PlanRow key={b.id} b={b} onEdit={() => setEditingBudget(budgetToForm(b))} onDelete={() => delBudget(b.id)} />)
                : <Empty>Sem metas variáveis. Elas são opcionais — gastos avulsos já caem nos Variáveis.</Empty>}
            </Panel>
          </>
        )}

        {/* TRANSAÇÕES */}
        {view === "transacoes" && (
          <Panel
            title={txFilterActive ? `${filteredTx.length} de ${monthTx.length} lançamento${monthTx.length !== 1 ? "s" : ""}` : `${monthTx.length} lançamento${monthTx.length !== 1 ? "s" : ""}`}
            meta={txFilterActive ? `+ R$ ${fmt(filteredIncome)} · − R$ ${fmt(filteredExpense)}` : `Saldo do mês: R$ ${fmt(realIncome - realExpense)}`}>
            <div className="cf-filterbar">
              <div className="cf-search">
                <Search size={15} />
                <input value={txSearch} onChange={(e) => setTxSearch(e.target.value)} placeholder="Buscar por descrição…" />
                {txSearch && <button onClick={() => setTxSearch("")} aria-label="Limpar busca"><X size={14} /></button>}
              </div>
              <div className="cf-seg cf-seg-sm">
                <button className={txKind === "all" ? "on" : ""} onClick={() => setTxKind("all")}>Todas</button>
                <button className={txKind === "income" ? "on g" : ""} onClick={() => setTxKind("income")}>Entradas</button>
                <button className={txKind === "expense" ? "on r" : ""} onClick={() => setTxKind("expense")}>Gastos</button>
              </div>
              <select className="cf-filter-select" value={txCat} onChange={(e) => setTxCat(e.target.value)} aria-label="Filtrar por categoria">
                <option value="all">Todas as categorias</option>
                {txCatsPresent.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              {txFilterActive && <button className="cf-filter-clear" onClick={() => { setTxSearch(""); setTxKind("all"); setTxCat("all"); }}>Limpar</button>}
            </div>
            {monthTx.length === 0
              ? <Empty>Nenhuma transação em {monthLabel(monthKey)}.<br />Toque em <b>Nova transação</b>.</Empty>
              : filteredTx.length === 0
                ? <Empty>Nenhuma transação encontrada com esse filtro.</Empty>
                : (
                  <div className="cf-tx-list">
                    {filteredTx.map((t) => {
                      const c = catOf(t); const Icon = c.icon; const fixo = fixedCats.has(t.category) && t.kind === "expense";
                      return (
                        <div key={t.id} className="cf-tx">
                          <span className="cf-cat" style={{ "--c": c.color }}><Icon size={16} strokeWidth={2.2} /></span>
                          <div className="cf-tx-main">
                            <span className="cf-tx-title">{t.title}</span>
                            <span className="cf-tx-meta">{c.label} · {t.date.split("-").reverse().join("/")}{t.kind === "expense" && <> · {fixo ? "fixo" : "variável"}</>}{t.budgetId ? " · conta fixa" : ""}</span>
                          </div>
                          <span className={`cf-tx-amt ${t.kind === "income" ? "g" : "r"}`}>{t.kind === "income" ? "+" : "−"} <Money value={t.amount} size="sm" /></span>
                          <div className="cf-row-acts">
                            <button className="cf-icbtn" onClick={() => setEditingTx(t)}><Pencil size={14} /></button>
                            <button className="cf-icbtn" onClick={() => delTx(t.id)}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
          </Panel>
        )}

        {/* CONTAS */}
        {view === "contas" && (
          <div className="cf-grid2">
            <Panel title="A pagar" accent="#F4C25A" meta={`R$ ${fmt(pendingTotal)}`}>
              {pendingBills.length ? pendingBills.map((b) => <BillRow key={b.id} b={b} paid={false} onToggle={() => toggleBill(b)} />)
                : <Empty>Tudo quitado em {monthLabel(monthKey)}.</Empty>}
            </Panel>
            <Panel title="Pagas" accent="#34E0A1" meta={`R$ ${fmt(sum(paidBills.map((b) => ({ amount: b.amount }))))}`}>
              {paidBills.length ? paidBills.map((b) => <BillRow key={b.id} b={b} paid={true} onToggle={() => toggleBill(b)} />)
                : <Empty>Marque uma conta como paga.</Empty>}
            </Panel>
          </div>
        )}

        {/* PERFIL */}
        {view === "perfil" && (
          <div className="cf-perfil">
            <Panel title="Conta">
              <div className="cf-prof-head">
                <span className="cf-avatar big">{data.profile.initial}</span>
                <div>
                  <input className="cf-name-input" value={data.profile.name} onChange={(e) => setData((d) => ({ ...d, profile: { ...d.profile, name: e.target.value, initial: (e.target.value[0] || "?").toUpperCase() } }))} />
                  <p className="cf-sub">Plano pessoal · Cifra</p>
                </div>
              </div>
            </Panel>
            <Panel title="Saldo inicial" accent="#9D8BFF" meta={`início de ${monthLabel(BASE_MONTH)}`}>
              <div className="cf-acc">
                <div className="cf-input-pre big"><i>R$</i><input type="number" step="0.01" value={data.accumulated} onChange={(e) => setData((d) => ({ ...d, accumulated: round2(Number(e.target.value)) || 0 }))} /></div>
                <p className="cf-hint"><Target size={14} /> A partir daqui, cada mês soma a economia. Fim de {monthShort(BASE_MONTH)}: <b>R$ {fmt(saldoFimOf(BASE_MONTH))}</b> · em 1 ano: <b>R$ {fmt(saldoFimOf(shiftMonth(BASE_MONTH, 12)))}</b></p>
              </div>
            </Panel>
            <Panel title="Dados">
              <div className="cf-data-row">
                <div><b>{data.budgets.length}</b><span>no plano</span></div>
                <div><b>{data.transactions.length}</b><span>transações</span></div>
                <div><b>{HAS_STORE ? "ativo" : "sessão"}</b><span>salvamento</span></div>
              </div>
              <button className="cf-btn ghost full" onClick={resetAll}><RotateCcw size={15} /> Restaurar dados de exemplo</button>
            </Panel>
          </div>
        )}

        <div className="cf-spacer" />
      </main>

      <nav className="cf-tabbar">
        {NAV.map((n) => <button key={n.id} className={view === n.id ? "on" : ""} onClick={() => setView(n.id)}><n.icon size={19} strokeWidth={2.1} /><span>{n.label}</span></button>)}
      </nav>

      {editingTx && <TxModal initial={editingTx === "new" ? null : editingTx} monthKey={monthKey} onClose={() => setEditingTx(null)} onSave={saveTx} />}
      {editingBudget && <BudgetModal initial={editingBudget === "new" ? null : editingBudget} monthKey={monthKey} onClose={() => setEditingBudget(null)} onSave={saveBudget} />}
      {toast && <div className="cf-toast" key={toast.id}>{toast.msg}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.cf-root{
  --bg:#0A0D12; --surface:#13181F; --surface-2:#181E27; --surface-3:#1E2530;
  --line:rgba(255,255,255,.06); --line-2:rgba(255,255,255,.11);
  --text:#EAEEF4; --dim:#98A1B0; --faint:#5C6573;
  --accent:#34E0A1; --income:#34E0A1; --expense:#FF7A85; --pending:#F4C25A; --violet:#9D8BFF;
  --mono:'JetBrains Mono',ui-monospace,monospace; --display:'Bricolage Grotesque',sans-serif; --ui:'Plus Jakarta Sans',system-ui,sans-serif;
  font-family:var(--ui); color:var(--text); background:var(--bg);
  display:flex; height:100vh; width:100%; overflow:hidden; position:relative; -webkit-font-smoothing:antialiased;
}
.cf-root *{ box-sizing:border-box; }
.cf-root::before{ content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px); background-size:30px 30px;
  -webkit-mask-image:radial-gradient(circle at 30% 0%,#000,transparent 70%); mask-image:radial-gradient(circle at 30% 0%,#000,transparent 70%); opacity:.6; }
.cf-root button{ font-family:inherit; cursor:pointer; border:none; background:none; color:inherit; }
.cf-root input,.cf-root select{ font-family:inherit; }
.cf-root :focus-visible{ outline:2px solid var(--accent); outline-offset:2px; border-radius:8px; }

.cf-side{ width:246px; flex-shrink:0; background:#0C1016; border-right:1px solid var(--line); display:flex; flex-direction:column; padding:22px 16px; position:relative; z-index:2; }
.cf-brand{ display:flex; align-items:center; gap:11px; padding:4px 6px 22px; }
.cf-mark{ width:36px; height:36px; border-radius:11px; display:grid; place-items:center; font-family:var(--display); font-weight:800; font-size:20px; color:#062018; background:linear-gradient(145deg,#3DEAA8,#1FB37E); box-shadow:0 4px 16px rgba(52,224,161,.3); }
.cf-brand-txt{ display:flex; flex-direction:column; line-height:1.1; }
.cf-brand-txt b{ font-family:var(--display); font-weight:700; font-size:17px; letter-spacing:-.02em; }
.cf-brand-txt i{ font-style:normal; font-size:10.5px; color:var(--faint); letter-spacing:.04em; }
.cf-nav{ display:flex; flex-direction:column; gap:3px; }
.cf-navitem{ display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:11px; color:var(--dim); font-size:14px; font-weight:500; transition:.15s; position:relative; text-align:left; width:100%; }
.cf-navitem:hover{ background:var(--surface); color:var(--text); }
.cf-navitem.on{ background:var(--surface-2); color:var(--text); font-weight:600; }
.cf-navitem.on::before{ content:''; position:absolute; left:-16px; top:50%; transform:translateY(-50%); width:3px; height:20px; border-radius:0 3px 3px 0; background:var(--accent); }
.cf-navitem.danger:hover{ color:var(--expense); background:rgba(255,122,133,.08); }
.cf-side-foot{ margin-top:auto; display:flex; flex-direction:column; gap:14px; }
.cf-user{ display:flex; align-items:center; gap:11px; padding:11px; border-radius:13px; background:var(--surface); border:1px solid var(--line); }
.cf-avatar{ width:34px; height:34px; border-radius:10px; display:grid; place-items:center; font-weight:700; font-size:15px; color:#062018; background:linear-gradient(145deg,#3DEAA8,#1FB37E); flex-shrink:0; }
.cf-avatar.big{ width:60px; height:60px; border-radius:18px; font-size:26px; }
.cf-user-txt{ display:flex; flex-direction:column; line-height:1.2; }
.cf-user-txt b{ font-size:13.5px; } .cf-user-txt i{ font-style:normal; font-size:11px; color:var(--faint); }

.cf-main{ flex:1; overflow-y:auto; padding:26px 30px; position:relative; z-index:1; }
.cf-main::-webkit-scrollbar{ width:10px; } .cf-main::-webkit-scrollbar-thumb{ background:var(--surface-3); border-radius:10px; border:3px solid var(--bg); }
.cf-topbar{ display:flex; justify-content:space-between; align-items:flex-end; gap:18px; margin-bottom:24px; flex-wrap:wrap; }
.cf-h1{ font-family:var(--display); font-weight:700; font-size:26px; letter-spacing:-.025em; margin:0; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.cf-prev-badge{ display:inline-flex; align-items:center; gap:5px; font-family:var(--ui); font-size:11.5px; font-weight:600; color:#BCAEFF; background:rgba(157,139,255,.14); border:1px solid rgba(157,139,255,.3); padding:4px 10px; border-radius:999px; letter-spacing:.02em; }
.cf-prev-badge.past{ color:var(--dim); background:var(--surface-2); border-color:var(--line-2); }
.cf-sub{ color:var(--dim); font-size:13.5px; margin:3px 0 0; }
.cf-topbar-acts{ display:flex; align-items:center; gap:12px; }
.cf-monthnav{ display:flex; align-items:center; gap:4px; background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:5px; }
.cf-monthnav span{ font-size:13.5px; font-weight:600; min-width:118px; text-align:center; }
.cf-monthnav button{ width:30px; height:30px; border-radius:8px; display:grid; place-items:center; color:var(--dim); transition:.15s; }
.cf-monthnav button:hover{ background:var(--surface-2); color:var(--text); }

.cf-btn{ display:inline-flex; align-items:center; gap:7px; background:var(--accent); color:#062018; font-weight:700; font-size:13.5px; padding:10px 16px; border-radius:11px; transition:.15s; }
.cf-btn:hover{ filter:brightness(1.07); transform:translateY(-1px); } .cf-btn:active{ transform:translateY(0); }
.cf-btn:disabled{ opacity:.4; cursor:not-allowed; transform:none; }
.cf-btn.ghost{ background:var(--surface-2); color:var(--text); border:1px solid var(--line-2); } .cf-btn.ghost:hover{ background:var(--surface-3); }
.cf-btn.full{ width:100%; justify-content:center; margin-top:14px; }

.cf-kpis{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:18px; }
.cf-kpi{ background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:18px 18px 16px; position:relative; overflow:hidden; }
.cf-kpi-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
.cf-eyebrow{ font-family:var(--display); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:var(--dim); display:inline-flex; align-items:center; gap:7px; }
.cf-prev-tag{ font-family:var(--ui); font-style:normal; font-size:9px; font-weight:600; letter-spacing:.04em; color:#BCAEFF; background:rgba(157,139,255,.16); padding:2px 6px; border-radius:5px; text-transform:none; }
.cf-kpi-ico{ width:28px; height:28px; border-radius:9px; display:grid; place-items:center; color:var(--k); background:color-mix(in srgb,var(--k) 14%,transparent); }
.cf-kpi-val{ margin-bottom:12px; }
.cf-kpi-bar{ height:4px; border-radius:3px; background:var(--surface-3); overflow:hidden; margin-bottom:11px; }
.cf-kpi-bar span{ display:block; height:100%; border-radius:3px; transition:width .5s cubic-bezier(.4,0,.2,1); opacity:.9; }
.cf-kpi-chip{ display:flex; gap:6px; flex-wrap:wrap; }
.cf-kpi-rail{ position:absolute; left:0; bottom:0; height:3px; width:100%; background:linear-gradient(90deg,var(--k),transparent); opacity:.55; }

.cf-money{ font-family:var(--mono); font-variant-numeric:tabular-nums; font-weight:600; letter-spacing:-.01em; white-space:nowrap; }
.cf-cur{ color:var(--faint); font-weight:500; margin-right:4px; }
.cf-money-lg{ font-size:27px; } .cf-money-lg .cf-cur{ font-size:14px; } .cf-money-lg .cf-dec{ font-size:17px; color:var(--dim); }
.cf-money-md{ font-size:19px; } .cf-money-md .cf-cur{ font-size:11px; } .cf-money-md .cf-dec{ color:var(--dim); }
.cf-money-sm{ font-size:13.5px; } .cf-money-sm .cf-cur{ font-size:10px; } .cf-money-sm .cf-dec{ color:var(--dim); }

.cf-chip{ font-family:var(--mono); font-size:11px; font-weight:500; padding:3px 8px; border-radius:7px; background:var(--surface-2); color:var(--dim); white-space:nowrap; }
.cf-chip.g{ color:#7CE7C0; background:rgba(52,224,161,.1); }
.cf-chip.r{ color:#FF9AA3; background:rgba(255,122,133,.1); }
.cf-chip.p{ color:#F7D58A; background:rgba(244,194,90,.12); }
.cf-chip.v{ color:#BCAEFF; background:rgba(157,139,255,.1); }

.cf-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px; }
.cf-panel{ background:var(--surface); border:1px solid var(--line); border-radius:18px; display:flex; flex-direction:column; }
.cf-panel-head{ display:flex; justify-content:space-between; align-items:center; padding:16px 18px; border-bottom:1px solid var(--line); }
.cf-panel-title{ font-family:var(--display); font-weight:600; font-size:15px; margin:0; display:flex; align-items:center; gap:9px; letter-spacing:-.01em; }
.cf-dot{ width:7px; height:7px; border-radius:50%; }
.cf-panel-meta{ font-family:var(--mono); font-size:12px; color:var(--dim); }
.cf-panel-body{ padding:6px 18px 12px; }
.cf-empty{ padding:26px 6px; text-align:center; color:var(--faint); font-size:13px; line-height:1.6; }
.cf-empty b{ color:var(--dim); }
.cf-sub-h{ font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--faint); padding:10px 0 4px; }
.cf-sub-h.pad{ padding-top:14px; border-top:1px solid var(--line); margin-top:8px; }
.cf-mini-empty{ font-size:12px; color:var(--faint); margin:2px 0 6px; }

/* budget row (dashboard fixos) */
.cf-brow{ display:flex; align-items:center; gap:13px; padding:11px 0; border-bottom:1px solid var(--line); }
.cf-brow:last-child{ border-bottom:none; }
.cf-cat{ width:34px; height:34px; border-radius:10px; display:grid; place-items:center; color:var(--c); background:color-mix(in srgb,var(--c) 15%,transparent); flex-shrink:0; }
.cf-brow-main{ flex:1; min-width:0; }
.cf-brow-head{ display:flex; justify-content:space-between; align-items:baseline; gap:10px; margin-bottom:7px; }
.cf-brow-title{ font-size:13.5px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:baseline; gap:8px; }
.cf-due{ font-style:normal; font-size:10px; color:var(--pending); font-family:var(--mono); }
.cf-brow-vals{ font-family:var(--mono); font-size:12.5px; flex-shrink:0; white-space:nowrap; }
.cf-brow-vals b{ font-weight:600; } .cf-brow-vals b.zero{ color:var(--faint); } .cf-brow-vals b.over{ color:var(--expense); }
.cf-brow-vals i{ font-style:normal; color:var(--faint); }
.cf-bar{ height:5px; border-radius:3px; background:var(--surface-3); overflow:hidden; }
.cf-bar-fill{ height:100%; border-radius:3px; transition:width .5s cubic-bezier(.4,0,.2,1); opacity:.85; }
.cf-pct{ font-family:var(--mono); font-size:11.5px; color:var(--dim); width:42px; text-align:right; flex-shrink:0; }
.cf-pct.over{ color:var(--expense); } .cf-pct.prev{ color:var(--violet); font-size:10px; }

/* generic rows / var rows */
.cf-row{ display:flex; align-items:center; gap:13px; padding:11px 0; border-bottom:1px solid var(--line); }
.cf-row:last-child{ border-bottom:none; }
.cf-row-main2{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.cf-row-title{ font-size:13.5px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cf-row-sub{ font-size:11px; color:var(--faint); }
.cf-row-amt2{ font-family:var(--mono); flex-shrink:0; }
.cf-row-amt2.g .cf-money,.cf-row-amt2.g .cf-cur{ color:#7CE7C0; }
.cf-prev-pill{ font-family:var(--mono); font-size:9.5px; color:var(--violet); background:rgba(157,139,255,.12); padding:3px 7px; border-radius:6px; flex-shrink:0; }
.cf-row-acts{ display:flex; gap:2px; opacity:0; transition:.15s; flex-shrink:0; }
.cf-row:hover .cf-row-acts,.cf-tx:hover .cf-row-acts{ opacity:1; }
.cf-row-acts.always{ opacity:1; }
.cf-icbtn{ width:28px; height:28px; border-radius:8px; display:grid; place-items:center; color:var(--faint); transition:.15s; }
.cf-icbtn:hover{ background:var(--surface-3); color:var(--text); }

/* bills */
.cf-bill{ display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--line); }
.cf-bill:last-child{ border-bottom:none; }
.cf-check{ width:26px; height:26px; border-radius:8px; border:1.5px solid var(--line-2); display:grid; place-items:center; color:var(--pending); flex-shrink:0; transition:.15s; }
.cf-check:hover{ border-color:var(--accent); }
.cf-check.on{ background:var(--accent); border-color:var(--accent); color:#062018; }
.cf-bill-main{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.cf-bill-title{ font-size:13.5px; font-weight:500; }
.cf-bill-title.done{ color:var(--dim); text-decoration:line-through; text-decoration-color:var(--faint); }
.cf-bill-meta{ font-size:11px; color:var(--faint); }
.cf-bill-amt{ flex-shrink:0; } .cf-bill-amt.g .cf-money,.cf-bill-amt.g .cf-cur{ color:#7CE7C0; } .cf-bill-amt.p .cf-money,.cf-bill-amt.p .cf-cur{ color:var(--pending); }

/* planning */
.cf-plan-banner{ display:flex; gap:13px; align-items:flex-start; padding:15px 18px; border-radius:16px; margin-bottom:18px; border:1px solid rgba(52,224,161,.22); background:linear-gradient(120deg,rgba(52,224,161,.09),rgba(157,139,255,.05)); }
.cf-plan-banner svg{ color:var(--accent); flex-shrink:0; margin-top:2px; }
.cf-plan-banner p{ margin:0; font-size:13px; line-height:1.55; color:var(--dim); } .cf-plan-banner b{ color:var(--text); font-weight:600; }
.cf-mini-cards{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
.cf-mini{ background:var(--surface); border:1px solid var(--line); border-radius:15px; padding:15px 16px; display:flex; flex-direction:column; gap:7px; position:relative; overflow:hidden; }
.cf-mini::after{ content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--k); opacity:.7; }
.cf-mini i{ font-style:normal; font-size:11px; color:var(--faint); }
.cf-plan-row{ display:flex; align-items:center; gap:14px; padding:13px 0; border-bottom:1px solid var(--line); }
.cf-plan-row:last-child{ border-bottom:none; }
.cf-plan-desc{ display:flex; flex-direction:column; gap:2px; min-width:140px; flex:1; }
.cf-plan-title{ font-size:14px; font-weight:600; }
.cf-plan-cat{ font-size:11.5px; color:var(--faint); }
.cf-plan-amt{ font-family:var(--mono); display:flex; align-items:baseline; gap:4px; flex-shrink:0; }
.cf-plan-amt em{ font-style:normal; font-size:10px; color:var(--faint); }
.cf-plan-meta{ display:flex; gap:7px; flex-wrap:wrap; justify-content:flex-end; min-width:210px; }
.cf-tag{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500; padding:4px 9px; border-radius:8px; background:var(--surface-2); color:var(--dim); white-space:nowrap; font-family:var(--mono); }
.cf-tag.period{ color:#BCAEFF; background:rgba(157,139,255,.1); }
.cf-tag.due{ color:#F7D58A; background:rgba(244,194,90,.12); }
.cf-tag.nodue{ color:var(--faint); }
.cf-tag.var{ color:#FFC199; background:rgba(255,164,107,.1); }

/* insights */
.cf-insights{ display:grid; grid-template-columns:1.5fr 1fr; gap:16px; margin-bottom:18px; }
.cf-insights-side{ display:flex; flex-direction:column; gap:16px; }
.cf-chartbox{ height:200px; margin-top:6px; }
.cf-rankcard{ display:flex; align-items:center; gap:14px; padding:18px; border-radius:18px; border:1px solid rgba(244,194,90,.25); background:linear-gradient(135deg,rgba(244,194,90,.12),rgba(244,194,90,.02)); }
.cf-trophy{ width:46px; height:46px; border-radius:13px; display:grid; place-items:center; color:#1a1505; background:linear-gradient(145deg,#F7D26B,#E0A93B); flex-shrink:0; box-shadow:0 4px 14px rgba(244,194,90,.25); }
.cf-rank-pos{ font-family:var(--display); font-weight:700; font-size:21px; color:#F7D26B; letter-spacing:-.02em; display:block; }
.cf-rank-cap{ font-size:12px; color:var(--dim); }
.cf-rank-txt{ flex:1; }
.cf-rank-eco{ text-align:right; display:flex; flex-direction:column; gap:2px; } .cf-rank-eco i{ font-style:normal; font-size:10px; color:var(--faint); }

/* projeção */
.cf-proj{ margin-bottom:18px; }
.cf-milestones{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding:10px 0 16px; }
.cf-mile{ background:var(--surface-2); border:1px solid var(--line); border-radius:14px; padding:13px 15px; display:flex; flex-direction:column; gap:5px; }
.cf-mile.now{ border-color:rgba(157,139,255,.4); background:linear-gradient(135deg,rgba(157,139,255,.12),rgba(157,139,255,.02)); }
.cf-mile-lab{ font-size:11px; font-weight:600; color:var(--dim); }
.cf-mile i{ font-style:normal; font-size:10.5px; color:var(--faint); font-family:var(--mono); }
.cf-proj-note{ display:flex; gap:8px; align-items:flex-start; font-size:11.5px; color:var(--faint); line-height:1.5; margin:12px 0 2px; }
.cf-proj-note svg{ flex-shrink:0; margin-top:2px; } .cf-proj-note b{ color:var(--dim); }

.cf-donut-wrap{ display:flex; gap:16px; align-items:center; padding:8px 0; }
.cf-donut{ width:130px; height:130px; position:relative; flex-shrink:0; }
.cf-donut-center{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
.cf-donut-center b{ font-family:var(--mono); font-size:14px; font-weight:600; } .cf-donut-center i{ font-style:normal; font-size:10px; color:var(--faint); }
.cf-legend{ list-style:none; margin:0; padding:0; flex:1; display:flex; flex-direction:column; gap:9px; min-width:0; }
.cf-legend li{ display:flex; align-items:center; gap:8px; font-size:12.5px; }
.cf-leg-dot{ width:9px; height:9px; border-radius:3px; flex-shrink:0; }
.cf-leg-lab{ color:var(--dim); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cf-leg-val{ font-family:var(--mono); font-size:11.5px; color:var(--text); }

.cf-tip{ background:var(--surface-3); border:1px solid var(--line-2); border-radius:10px; padding:8px 11px; box-shadow:0 8px 24px rgba(0,0,0,.4); }
.cf-tip-lab{ font-size:11px; color:var(--dim); margin-bottom:3px; font-weight:600; }
.cf-tip-val .cf-money{ font-size:14px; }

.cf-filterbar{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; padding:8px 0 14px; border-bottom:1px solid var(--line); margin-bottom:4px; }
.cf-search{ display:flex; align-items:center; gap:8px; background:var(--surface-3); border:1px solid var(--line-2); border-radius:10px; padding:0 11px; flex:1; min-width:170px; transition:.15s; }
.cf-search:focus-within{ border-color:var(--accent); }
.cf-search svg{ color:var(--faint); flex-shrink:0; }
.cf-search input{ background:none; border:none; outline:none; color:var(--text); font-size:13.5px; padding:9px 0; width:100%; }
.cf-search button{ width:22px; height:22px; border-radius:6px; display:grid; place-items:center; color:var(--faint); flex-shrink:0; transition:.15s; }
.cf-search button:hover{ background:var(--surface); color:var(--text); }
.cf-seg-sm{ padding:3px; flex-shrink:0; }
.cf-seg-sm button{ padding:7px 13px; font-size:12.5px; }
.cf-filter-select{ background:var(--surface-3); border:1px solid var(--line-2); border-radius:10px; color:var(--text); font-size:13px; padding:9px 11px; outline:none; cursor:pointer; transition:.15s; }
.cf-filter-select:focus{ border-color:var(--accent); }
.cf-filter-clear{ font-size:12.5px; font-weight:600; color:var(--dim); padding:8px 12px; border-radius:9px; transition:.15s; }
.cf-filter-clear:hover{ background:var(--surface-3); color:var(--text); }
.cf-tx-list{ display:flex; flex-direction:column; }
.cf-tx{ display:flex; align-items:center; gap:13px; padding:12px 0; border-bottom:1px solid var(--line); }
.cf-tx:last-child{ border-bottom:none; }
.cf-tx-main{ flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
.cf-tx-title{ font-size:14px; font-weight:500; }
.cf-tx-meta{ font-size:11.5px; color:var(--faint); }
.cf-tx-amt{ font-family:var(--mono); font-size:14px; font-weight:600; flex-shrink:0; display:flex; align-items:center; gap:2px; }
.cf-tx-amt.g,.cf-tx-amt.g .cf-money,.cf-tx-amt.g .cf-cur{ color:#7CE7C0; }
.cf-tx-amt.r,.cf-tx-amt.r .cf-money,.cf-tx-amt.r .cf-cur{ color:#FF9AA3; }

.cf-perfil{ display:grid; grid-template-columns:1fr 1fr; gap:16px; max-width:920px; }
.cf-perfil .cf-panel:first-child{ grid-column:1 / -1; }
.cf-prof-head{ display:flex; align-items:center; gap:18px; padding:8px 0; }
.cf-name-input{ background:none; border:none; font-family:var(--display); font-weight:700; font-size:22px; color:var(--text); padding:2px 4px; border-radius:8px; width:100%; }
.cf-name-input:hover{ background:var(--surface-2); }
.cf-acc{ padding:6px 0; }
.cf-hint{ display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--dim); margin:14px 0 0; } .cf-hint b{ font-family:var(--mono); color:var(--accent); }
.cf-data-row{ display:flex; gap:12px; padding:6px 0 4px; }
.cf-data-row>div{ flex:1; background:var(--surface-2); border-radius:13px; padding:14px; text-align:center; }
.cf-data-row b{ font-family:var(--mono); font-size:20px; display:block; } .cf-data-row span{ font-size:11px; color:var(--faint); }

/* inputs */
.cf-input-pre{ display:flex; align-items:center; background:var(--surface-3); border:1px solid var(--line-2); border-radius:11px; padding:0 13px; transition:.15s; }
.cf-input-pre:focus-within{ border-color:var(--accent); }
.cf-input-pre i{ font-style:normal; color:var(--faint); font-family:var(--mono); font-size:13px; }
.cf-input-pre u{ text-decoration:none; color:var(--faint); font-size:11px; font-family:var(--mono); }
.cf-input-pre input{ background:none; border:none; color:var(--text); font-family:var(--mono); font-weight:600; padding:11px 8px; width:100%; outline:none; font-size:14px; }
.cf-input-pre.big input{ font-size:22px; padding:14px 8px; } .cf-input-pre.big i{ font-size:16px; }

/* modal */
.cf-overlay{ position:fixed; inset:0; background:rgba(5,7,10,.66); backdrop-filter:blur(4px); display:grid; place-items:center; padding:20px; z-index:50; animation:cf-fade .15s ease; }
.cf-dialog{ width:100%; max-width:480px; background:var(--surface); border:1px solid var(--line-2); border-radius:22px; padding:22px; max-height:92vh; overflow-y:auto; box-shadow:0 24px 70px rgba(0,0,0,.5); animation:cf-pop .2s cubic-bezier(.2,.8,.3,1); }
.cf-dialog-head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.cf-dialog-head h3{ font-family:var(--display); font-weight:700; font-size:19px; margin:0; }
.cf-field{ display:flex; flex-direction:column; gap:7px; margin-bottom:14px; }
.cf-field>span{ font-size:12px; font-weight:600; color:var(--dim); }
.cf-field input[type=text],.cf-field input:not([type]),.cf-field input[type=number],.cf-field input[type=date],.cf-field input[type=month],.cf-field select{
  background:var(--surface-3); border:1px solid var(--line-2); border-radius:11px; padding:11px 13px; color:var(--text); font-size:14px; outline:none; transition:.15s; width:100%; }
.cf-field input:focus,.cf-field select:focus{ border-color:var(--accent); }
.cf-field input[type=date],.cf-field input[type=month]{ color-scheme:dark; font-family:var(--mono); }
.cf-field input.disabled{ opacity:.4; }
.cf-field-row{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.cf-dueday{ max-width:200px; }
.cf-seg{ display:flex; background:var(--surface-3); border-radius:11px; padding:4px; gap:4px; }
.cf-seg button{ flex:1; padding:9px; border-radius:8px; color:var(--dim); font-size:13px; font-weight:600; transition:.15s; }
.cf-seg button:hover{ color:var(--text); }
.cf-seg button.on{ background:var(--surface); color:var(--text); box-shadow:0 1px 4px rgba(0,0,0,.2); }
.cf-seg button.on.g{ color:var(--income); } .cf-seg button.on.r{ color:var(--expense); }
.cf-fixed-block{ background:var(--surface-2); border:1px solid var(--line); border-radius:14px; padding:14px 14px 4px; margin-bottom:14px; }
.cf-checkrow{ display:flex; align-items:center; gap:10px; margin-bottom:12px; cursor:pointer; font-size:13px; color:var(--dim); }
.cf-checkrow input{ width:18px; height:18px; accent-color:var(--accent); cursor:pointer; }
.cf-modal-hint{ display:flex; gap:8px; align-items:flex-start; font-size:12px; color:var(--faint); line-height:1.5; margin:0 0 14px; padding:10px 12px; background:var(--surface-2); border-radius:11px; }
.cf-modal-hint svg{ flex-shrink:0; margin-top:1px; color:var(--dim); } .cf-modal-hint b{ color:var(--dim); }
.cf-dialog-foot{ display:flex; gap:10px; margin-top:4px; } .cf-dialog-foot .cf-btn{ flex:1; justify-content:center; }

.cf-toast{ position:fixed; bottom:26px; left:50%; transform:translateX(-50%); background:var(--surface-3); border:1px solid var(--line-2); color:var(--text); padding:12px 20px; border-radius:13px; font-size:13.5px; font-weight:500; box-shadow:0 12px 36px rgba(0,0,0,.5); z-index:60; animation:cf-toast .25s ease; }
.cf-toast::before{ content:'✓'; color:var(--accent); margin-right:8px; font-weight:800; }
.cf-tabbar{ display:none; } .cf-spacer{ height:8px; }

@keyframes cf-fade{ from{opacity:0} to{opacity:1} }
@keyframes cf-pop{ from{opacity:0; transform:translateY(12px) scale(.98)} to{opacity:1; transform:none} }
@keyframes cf-toast{ from{opacity:0; transform:translate(-50%,12px)} to{opacity:1; transform:translate(-50%,0)} }

@media (max-width:1100px){ .cf-kpis,.cf-mini-cards,.cf-milestones{ grid-template-columns:repeat(2,1fr); } .cf-insights{ grid-template-columns:1fr; } }
@media (max-width:860px){
  .cf-side{ display:none; }
  .cf-main{ padding:18px 16px 92px; }
  .cf-root::before{ -webkit-mask-image:radial-gradient(circle at 50% 0%,#000,transparent 60%); mask-image:radial-gradient(circle at 50% 0%,#000,transparent 60%); }
  .cf-grid2,.cf-perfil{ grid-template-columns:1fr; }
  .cf-topbar{ align-items:stretch; } .cf-topbar-acts{ width:100%; justify-content:space-between; }
  .cf-btn span{ display:none; } .cf-btn{ padding:11px; }
  .cf-plan-row{ flex-wrap:wrap; }
  .cf-plan-meta{ justify-content:flex-start; min-width:0; width:100%; padding-left:48px; }
  .cf-milestones{ grid-template-columns:repeat(2,1fr); } .cf-rankcard{ justify-content:flex-start; }
  .cf-tabbar{ display:flex; position:fixed; bottom:0; left:0; right:0; background:#0C1016; border-top:1px solid var(--line-2); padding:8px 8px calc(8px + env(safe-area-inset-bottom)); z-index:40; justify-content:space-around; }
  .cf-tabbar button{ display:flex; flex-direction:column; align-items:center; gap:3px; color:var(--faint); font-size:9.5px; font-weight:600; padding:4px 6px; flex:1; transition:.15s; }
  .cf-tabbar button.on{ color:var(--accent); }
}
@media (max-width:520px){ .cf-kpis,.cf-mini-cards,.cf-milestones{ grid-template-columns:1fr; } .cf-h1{ font-size:22px; } .cf-donut-wrap{ flex-direction:column; } .cf-field-row{ grid-template-columns:1fr; } .cf-search{ min-width:100%; } .cf-seg-sm,.cf-filter-select{ flex:1; } }
@media (prefers-reduced-motion:reduce){ .cf-root *{ animation:none !important; transition:none !important; } }
`;
