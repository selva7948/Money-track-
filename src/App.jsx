import React, { useState, useEffect, useMemo } from "react";
import {
  Home, Plus, BarChart3, Users, Search, X, Moon, Sun,
  TrendingUp, TrendingDown, Wallet, PiggyBank, AlertTriangle,
  Filter, Download, ChevronLeft, ChevronRight, MapPin, Tag,
  Store, Calendar, CreditCard, FileText, Trash2, ChevronDown, Landmark, Settings, UploadCloud, DownloadCloud
} from "lucide-react";

const CATEGORIES = [
  { name: "Salary", type: "income", color: "#22C55E" },
  { name: "EMI", type: "expense", color: "#EF4444" },
  { name: "Rent", type: "expense", color: "#F97316" },
  { name: "Food", type: "expense", color: "#F59E0B" },
  { name: "Travel", type: "expense", color: "#3B82F6" },
  { name: "Shopping", type: "expense", color: "#EC4899" },
  { name: "Investments", type: "expense", color: "#8B5CF6" },
  { name: "Gold", type: "expense", color: "#EAB308" },
  { name: "RD", type: "expense", color: "#14B8A6" },
  { name: "Medical", type: "expense", color: "#F43F5E" },
  { name: "Entertainment", type: "expense", color: "#A855F7" },
];

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank"];
const COMMON_BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB", "Canara", "BOB"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function formatINR(n) {
  const num = Number(n) || 0;
  const neg = num < 0;
  const abs = Math.abs(num);
  const str = abs.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return (neg ? "-₹" : "₹") + str;
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

async function loadData() {
  try {
    const raw = localStorage.getItem("expense-tracker-data");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
async function saveData(data) {
  try {
    localStorage.setItem("expense-tracker-data", JSON.stringify(data));
  } catch (e) {}
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await loadData();
      if (data) {
        setTransactions(data.transactions || []);
        setCustomCategories(data.customCategories || []);
        setBudgets(data.budgets || {});
        setDark(data.dark !== undefined ? data.dark : true);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveData({ transactions, customCategories, budgets, dark });
  }, [transactions, customCategories, budgets, dark, loaded]);

  const allCategories = useMemo(
    () => [...CATEGORIES, ...customCategories.map((c) => ({ name: c, type: "expense", color: "#64748B" }))],
    [customCategories]
  );

  const addTransaction = (txn) => {
    if (txn.id) {
      setTransactions((prev) => prev.map((t) => (t.id === txn.id ? txn : t)));
    } else {
      setTransactions((prev) => [...prev, { ...txn, id: uid() }]);
    }
    setShowAdd(false);
    setEditTxn(null);
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addCustomCategory = (name) => {
    if (name && !allCategories.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setCustomCategories((prev) => [...prev, name]);
    }
  };

  const exportBackup = () => {
    const data = { transactions, customCategories, budgets, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `expense-tracker-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBackup = (file, onDone) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.transactions)) throw new Error("Invalid backup file");
        setTransactions(data.transactions || []);
        setCustomCategories(data.customCategories || []);
        setBudgets(data.budgets || {});
        onDone(true, data.transactions.length);
      } catch (err) {
        onDone(false, 0);
      }
    };
    reader.readAsText(file);
  };

  if (!loaded) {
    return (
      <div style={{ ...S.app, ...(dark ? S.dark : S.light), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: dark ? "#94A3B8" : "#64748B" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ ...S.app, ...(dark ? S.dark : S.light) }}>
      <div style={S.container}>
        <Header dark={dark} setDark={setDark} tab={tab} onSettings={() => setShowSettings(true)} />
        <div style={S.content}>
          {tab === "dashboard" && (
            <Dashboard
              transactions={transactions}
              budgets={budgets}
              dark={dark}
              onEdit={(t) => { setEditTxn(t); setShowAdd(true); }}
              onDelete={deleteTransaction}
            />
          )}
          {tab === "reports" && (
            <Reports transactions={transactions} dark={dark} />
          )}
          {tab === "people" && (
            <PeopleMerchants transactions={transactions} dark={dark} />
          )}
          {tab === "budgets" && (
            <Budgets budgets={budgets} setBudgets={setBudgets} categories={allCategories} transactions={transactions} dark={dark} />
          )}
        </div>
        <BottomNav tab={tab} setTab={setTab} dark={dark} onAdd={() => { setEditTxn(null); setShowAdd(true); }} />
        {showAdd && (
          <AddTransactionModal
            categories={allCategories}
            onClose={() => { setShowAdd(false); setEditTxn(null); }}
            onSave={addTransaction}
            onAddCategory={addCustomCategory}
            dark={dark}
            editTxn={editTxn}
          />
        )}
        {showSettings && (
          <SettingsModal
            dark={dark}
            onClose={() => setShowSettings(false)}
            onExport={exportBackup}
            onImport={importBackup}
            transactionCount={transactions.length}
          />
        )}
      </div>
    </div>
  );
}

function Header({ dark, setDark, tab, onSettings }) {
  const titles = { dashboard: "Dashboard", reports: "Reports", people: "People & Merchants", budgets: "Budgets" };
  return (
    <div style={{ ...S.header, borderColor: dark ? "#1E293B" : "#E2E8F0" }}>
      <div>
        <div style={{ fontSize: 12, color: dark ? "#64748B" : "#94A3B8", fontWeight: 600, letterSpacing: 0.5 }}>EXPENSE TRACKER</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A" }}>{titles[tab]}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSettings} style={{ ...S.iconBtn, background: dark ? "#1A2028" : "#F1F5F9" }}>
          <Settings size={18} color={dark ? "#94A3B8" : "#64748B"} />
        </button>
        <button onClick={() => setDark(!dark)} style={{ ...S.iconBtn, background: dark ? "#1A2028" : "#F1F5F9" }}>
          {dark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#475569" />}
        </button>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, dark, onAdd }) {
  const items = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "reports", icon: BarChart3, label: "Reports" },
    { id: "add", icon: Plus, label: "Add" },
    { id: "people", icon: Users, label: "People" },
    { id: "budgets", icon: PiggyBank, label: "Budget" },
  ];
  return (
    <div style={{ ...S.bottomNav, background: dark ? "#141A21" : "#FFFFFF", borderColor: dark ? "#1E293B" : "#E2E8F0" }}>
      {items.map((item) => {
        const Icon = item.icon;
        if (item.id === "add") {
          return (
            <button key={item.id} onClick={onAdd} style={S.fab}>
              <Plus size={24} color="#fff" strokeWidth={2.5} />
            </button>
          );
        }
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{ ...S.navBtn, color: active ? "#3B82F6" : dark ? "#64748B" : "#94A3B8" }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Dashboard({ transactions, budgets, dark, onEdit, onDelete }) {
  const now = new Date();
  const thisMonth = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const income = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalBalance = transactions.reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
  const savings = income - expense;
  const totalBudget = Object.values(budgets).reduce((s, b) => s + Number(b || 0), 0);
  const remainingBudget = totalBudget - expense;

  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayExpense = transactions
        .filter((t) => t.type === "expense" && t.date.slice(0, 10) === key)
        .reduce((s, t) => s + Number(t.amount), 0);
      days.push({ label: d.toLocaleDateString("en-IN", { weekday: "short" }), value: dayExpense });
    }
    return days;
  }, [transactions]);

  const maxVal = Math.max(...last7.map((d) => d.value), 1);
  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <div>
      <div style={S.cardGrid}>
        <StatCard dark={dark} label="Total Balance" value={formatINR(totalBalance)} icon={Wallet} color="#3B82F6" />
        <StatCard dark={dark} label="Income (Month)" value={formatINR(income)} icon={TrendingUp} color="#22C55E" />
        <StatCard dark={dark} label="Expenses (Month)" value={formatINR(expense)} icon={TrendingDown} color="#EF4444" />
        <StatCard dark={dark} label="Savings" value={formatINR(savings)} icon={PiggyBank} color="#8B5CF6" />
      </div>

      {totalBudget > 0 && (
        <div style={{ ...S.card, background: dark ? "#1A2028" : "#fff", marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A" }}>Remaining Budget</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: remainingBudget < 0 ? "#EF4444" : "#22C55E" }}>
              {formatINR(remainingBudget)}
            </span>
          </div>
          <ProgressBar value={expense} max={totalBudget} dark={dark} />
        </div>
      )}

      <div style={{ ...S.card, background: dark ? "#1A2028" : "#fff", marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 12 }}>Last 7 Days</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
          {last7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: "100%",
                  height: Math.max((d.value / maxVal) * 70, 3),
                  background: d.value > 0 ? "#EF4444" : dark ? "#293241" : "#E2E8F0",
                  borderRadius: 4,
                }}
              />
              <span style={{ fontSize: 10, color: dark ? "#64748B" : "#94A3B8" }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 8 }}>Recent Transactions</div>
        {recent.length === 0 && (
          <div style={{ textAlign: "center", padding: 30, color: dark ? "#475569" : "#94A3B8", fontSize: 13 }}>
            No transactions yet. Tap + to add one.
          </div>
        )}
        {recent.map((t) => (
          <TxnRow key={t.id} t={t} dark={dark} onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} />
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, dark }) {
  const pct = Math.min((value / max) * 100, 100);
  const over = value > max;
  return (
    <div style={{ height: 8, borderRadius: 4, background: dark ? "#293241" : "#E2E8F0", overflow: "hidden" }}>
      <div style={{ height: "100%", width: pct + "%", background: over ? "#EF4444" : "#22C55E", borderRadius: 4 }} />
    </div>
  );
}

function StatCard({ dark, label, value, icon: Icon, color }) {
  return (
    <div style={{ ...S.statCard, background: dark ? "#1A2028" : "#fff" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: 11, color: dark ? "#64748B" : "#94A3B8", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function TxnRow({ t, dark, onEdit, onDelete }) {
  const cat = CATEGORIES.find((c) => c.name === t.category);
  const color = cat ? cat.color : "#64748B";
  const [showActions, setShowActions] = useState(false);
  return (
    <div
      style={{ ...S.txnRow, background: dark ? "#1A2028" : "#fff" }}
      onClick={() => setShowActions(!showActions)}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Tag size={16} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.category}{t.merchant ? ` · ${t.merchant}` : ""}
        </div>
        <div style={{ fontSize: 11, color: dark ? "#64748B" : "#94A3B8", display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          <span>{new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
          {t.person && <span>· {t.person}</span>}
          {t.paymentMethod && <span>· {t.paymentMethod}</span>}
          {t.bank && <span>· {t.bank}</span>}
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: t.type === "income" ? "#22C55E" : "#EF4444", flexShrink: 0 }}>
        {t.type === "income" ? "+" : "-"}{formatINR(t.amount).replace("-", "")}
      </div>
      {showActions && (
        <div style={{ position: "absolute", right: 8, top: "100%", background: dark ? "#242C38" : "#fff", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 5, overflow: "hidden" }}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ ...S.menuBtn, color: dark ? "#F1F5F9" : "#0F172A" }}>Edit</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ ...S.menuBtn, color: "#EF4444" }}>Delete</button>
        </div>
      )}
    </div>
  );
}

function Reports({ transactions, dark }) {
  const [period, setPeriod] = useState("monthly");
  const [offset, setOffset] = useState(0);

  const { filtered, label } = useMemo(() => {
    const now = new Date();
    let start, end, label;
    if (period === "daily") {
      const d = new Date(now); d.setDate(d.getDate() + offset);
      start = new Date(d.setHours(0, 0, 0, 0));
      end = new Date(d.setHours(23, 59, 59, 999));
      label = start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } else if (period === "weekly") {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay() + offset * 7);
      start = new Date(d.setHours(0, 0, 0, 0));
      end = new Date(new Date(start).setDate(start.getDate() + 6));
      end.setHours(23, 59, 59, 999);
      label = `${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;
    } else if (period === "yearly") {
      const y = now.getFullYear() + offset;
      start = new Date(y, 0, 1); end = new Date(y, 11, 31, 23, 59, 59);
      label = String(y);
    } else {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    }
    const filtered = transactions.filter((t) => {
      const dt = new Date(t.date);
      return dt >= start && dt <= end;
    });
    return { filtered, label };
  }, [transactions, period, offset]);

  const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const byPayment = useMemo(() => {
    const map = {};
    filtered.filter((t) => t.type === "expense").forEach((t) => {
      const pm = t.paymentMethod || "Unspecified";
      map[pm] = (map[pm] || 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const maxCat = Math.max(...byCategory.map((c) => c[1]), 1);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
        {["daily", "weekly", "monthly", "yearly"].map((p) => (
          <button
            key={p}
            onClick={() => { setPeriod(p); setOffset(0); }}
            style={{
              ...S.pill,
              background: period === p ? "#3B82F6" : dark ? "#1A2028" : "#fff",
              color: period === p ? "#fff" : dark ? "#94A3B8" : "#64748B",
            }}
          >
            {p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setOffset(offset - 1)} style={{ ...S.iconBtn, background: dark ? "#1A2028" : "#fff" }}>
          <ChevronLeft size={18} color={dark ? "#94A3B8" : "#64748B"} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A" }}>{label}</span>
        <button onClick={() => setOffset(offset + 1)} style={{ ...S.iconBtn, background: dark ? "#1A2028" : "#fff" }}>
          <ChevronRight size={18} color={dark ? "#94A3B8" : "#64748B"} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ ...S.card, flex: 1, background: dark ? "#1A2028" : "#fff" }}>
          <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 700 }}>INCOME</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A" }}>{formatINR(income)}</div>
        </div>
        <div style={{ ...S.card, flex: 1, background: dark ? "#1A2028" : "#fff" }}>
          <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 700 }}>EXPENSE</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A" }}>{formatINR(expense)}</div>
        </div>
      </div>

      <div style={{ ...S.card, background: dark ? "#1A2028" : "#fff", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 10 }}>Category-wise Spending</div>
        {byCategory.length === 0 && <div style={{ fontSize: 12, color: dark ? "#475569" : "#94A3B8" }}>No expenses in this period.</div>}
        {byCategory.map(([cat, amt]) => {
          const c = CATEGORIES.find((x) => x.name === cat);
          const color = c ? c.color : "#64748B";
          return (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: dark ? "#CBD5E1" : "#334155", fontWeight: 600 }}>{cat}</span>
                <span style={{ color: dark ? "#94A3B8" : "#64748B" }}>{formatINR(amt)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: dark ? "#293241" : "#E2E8F0" }}>
                <div style={{ height: "100%", width: (amt / maxCat) * 100 + "%", background: color, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...S.card, background: dark ? "#1A2028" : "#fff" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 10 }}>Payment Method Analysis</div>
        {byPayment.length === 0 && <div style={{ fontSize: 12, color: dark ? "#475569" : "#94A3B8" }}>No expenses in this period.</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {byPayment.map(([pm, amt]) => (
            <div key={pm} style={{ ...S.pmChip, background: dark ? "#242C38" : "#F1F5F9" }}>
              <CreditCard size={12} color={dark ? "#94A3B8" : "#64748B"} />
              <span style={{ fontSize: 12, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A" }}>{pm}</span>
              <span style={{ fontSize: 12, color: dark ? "#94A3B8" : "#64748B" }}>{formatINR(amt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PeopleMerchants({ transactions, dark }) {
  const [view, setView] = useState("person");
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      const key = view === "person" ? (t.person || "Unspecified") : view === "merchant" ? (t.merchant || "Unspecified") : (t.bank || "Unspecified");
      if (!map[key]) map[key] = { total: 0, count: 0, items: [] };
      map[key].total += Number(t.amount);
      map[key].count += 1;
      map[key].items.push(t);
    });
    return Object.entries(map)
      .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b[1].total - a[1].total);
  }, [transactions, view, search]);

  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => setView("person")}
          style={{ ...S.pill, flex: 1, background: view === "person" ? "#3B82F6" : dark ? "#1A2028" : "#fff", color: view === "person" ? "#fff" : dark ? "#94A3B8" : "#64748B" }}
        >
          <Users size={13} style={{ marginRight: 5, verticalAlign: -2 }} /> By Person / Group
        </button>
        <button
          onClick={() => setView("merchant")}
          style={{ ...S.pill, flex: 1, background: view === "merchant" ? "#3B82F6" : dark ? "#1A2028" : "#fff", color: view === "merchant" ? "#fff" : dark ? "#94A3B8" : "#64748B" }}
        >
          <Store size={13} style={{ marginRight: 5, verticalAlign: -2 }} /> By Merchant
        </button>
        <button
          onClick={() => setView("bank")}
          style={{ ...S.pill, flex: 1, background: view === "bank" ? "#3B82F6" : dark ? "#1A2028" : "#fff", color: view === "bank" ? "#fff" : dark ? "#94A3B8" : "#64748B" }}
        >
          <Landmark size={13} style={{ marginRight: 5, verticalAlign: -2 }} /> By Bank
        </button>
      </div>

      <div style={{ ...S.searchBox, background: dark ? "#1A2028" : "#fff", marginBottom: 12 }}>
        <Search size={15} color={dark ? "#64748B" : "#94A3B8"} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={view === "person" ? "Search person or group..." : view === "merchant" ? "Search merchant..." : "Search bank..."}
          style={{ ...S.searchInput, color: dark ? "#F1F5F9" : "#0F172A" }}
        />
      </div>

      {grouped.length === 0 && (
        <div style={{ textAlign: "center", padding: 30, color: dark ? "#475569" : "#94A3B8", fontSize: 13 }}>
          No {view === "person" ? "people/groups" : view === "merchant" ? "merchants" : "banks"} tagged yet.
        </div>
      )}

      {grouped.map(([name, data]) => (
        <div key={name} style={{ ...S.card, background: dark ? "#1A2028" : "#fff", marginBottom: 10, cursor: "pointer" }} onClick={() => setExpanded(expanded === name ? null : name)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#3B82F620", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {view === "person" ? <Users size={16} color="#3B82F6" /> : view === "merchant" ? <Store size={16} color="#3B82F6" /> : <Landmark size={16} color="#3B82F6" />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A" }}>{name}</div>
                <div style={{ fontSize: 11, color: dark ? "#64748B" : "#94A3B8" }}>{data.count} transaction{data.count > 1 ? "s" : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A" }}>{formatINR(data.total)}</span>
              <ChevronDown size={16} color={dark ? "#64748B" : "#94A3B8"} style={{ transform: expanded === name ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </div>
          </div>
          {expanded === name && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${dark ? "#293241" : "#E2E8F0"}` }}>
              {data.items.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12 }}>
                  <div style={{ color: dark ? "#94A3B8" : "#64748B" }}>
                    <div>{new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {t.category}</div>
                    {t.location && <div style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}><MapPin size={9} />{t.location}</div>}
                  </div>
                  <span style={{ color: "#EF4444", fontWeight: 700 }}>{formatINR(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Budgets({ budgets, setBudgets, categories, transactions, dark }) {
  const now = new Date();
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const thisMonthExpense = (cat) =>
    transactions
      .filter((t) => t.type === "expense" && t.category === cat && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
      .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      <div style={{ fontSize: 12, color: dark ? "#64748B" : "#94A3B8", marginBottom: 12 }}>
        Set a monthly budget per category. You'll see a warning when you go over.
      </div>
      {expenseCategories.map((c) => {
        const spent = thisMonthExpense(c.name);
        const budget = Number(budgets[c.name] || 0);
        const over = budget > 0 && spent > budget;
        return (
          <div key={c.name} style={{ ...S.card, background: dark ? "#1A2028" : "#fff", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A" }}>{c.name}</span>
                {over && <AlertTriangle size={14} color="#F59E0B" />}
              </div>
              <input
                type="number"
                value={budgets[c.name] || ""}
                onChange={(e) => setBudgets((prev) => ({ ...prev, [c.name]: e.target.value }))}
                placeholder="Set ₹"
                style={{ ...S.budgetInput, background: dark ? "#0F1419" : "#F8FAFC", color: dark ? "#F1F5F9" : "#0F172A", borderColor: dark ? "#293241" : "#E2E8F0" }}
              />
            </div>
            {budget > 0 && (
              <>
                <ProgressBar value={spent} max={budget} dark={dark} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: over ? "#EF4444" : dark ? "#64748B" : "#94A3B8" }}>
                  <span>{formatINR(spent)} spent</span>
                  <span>{over ? `Over by ${formatINR(spent - budget)}` : `${formatINR(budget - spent)} left`}</span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SettingsModal({ dark, onClose, onExport, onImport, transactionCount }) {
  const [status, setStatus] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onImport(file, (success, count) => {
      setStatus(success ? { ok: true, msg: `Restored ${count} transactions successfully.` } : { ok: false, msg: "Invalid backup file. Please pick a valid export." });
    });
    e.target.value = "";
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, background: dark ? "#141A21" : "#fff" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A" }}>Backup & Restore</div>
          <button onClick={onClose} style={{ ...S.iconBtn, background: dark ? "#1A2028" : "#F1F5F9" }}>
            <X size={18} color={dark ? "#94A3B8" : "#64748B"} />
          </button>
        </div>

        <div style={{ fontSize: 12, color: dark ? "#64748B" : "#94A3B8", marginBottom: 16, lineHeight: 1.5 }}>
          If the app gets deleted or you switch phones, your data (currently {transactionCount} transactions) can be lost. Export a backup file and keep it safe — you can restore everything from it anytime.
        </div>

        <div style={{ ...S.card, background: dark ? "#1A2028" : "#F8FAFC", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#22C55E20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DownloadCloud size={17} color="#22C55E" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A" }}>Export Backup</div>
              <div style={{ fontSize: 11, color: dark ? "#64748B" : "#94A3B8" }}>Save all data as a JSON file</div>
            </div>
          </div>
          <button onClick={onExport} style={{ ...S.saveBtn, background: "#22C55E" }}>Download Backup File</button>
        </div>

        <div style={{ ...S.card, background: dark ? "#1A2028" : "#F8FAFC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#3B82F620", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UploadCloud size={17} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#F1F5F9" : "#0F172A" }}>Restore Backup</div>
              <div style={{ fontSize: 11, color: dark ? "#64748B" : "#94A3B8" }}>Pick a backup file to restore. This replaces current data.</div>
            </div>
          </div>
          <input type="file" accept="application/json" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
          <button onClick={() => fileInputRef.current.click()} style={{ ...S.saveBtn, background: "#3B82F6" }}>Choose Backup File</button>
        </div>

        {status && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: status.ok ? "#22C55E20" : "#EF444420", color: status.ok ? "#22C55E" : "#EF4444", fontSize: 12, fontWeight: 600 }}>
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function AddTransactionModal({ categories, onClose, onSave, onAddCategory, dark, editTxn }) {
  const [type, setType] = useState(editTxn?.type || "expense");
  const [amount, setAmount] = useState(editTxn?.amount || "");
  const [category, setCategory] = useState(editTxn?.category || "");
  const [date, setDate] = useState(editTxn?.date || todayISO());
  const [paymentMethod, setPaymentMethod] = useState(editTxn?.paymentMethod || "UPI");
  const [bank, setBank] = useState(editTxn?.bank || "");
  const [merchant, setMerchant] = useState(editTxn?.merchant || "");
  const [person, setPerson] = useState(editTxn?.person || "");
  const [notes, setNotes] = useState(editTxn?.notes || "");
  const [location, setLocation] = useState(editTxn?.location || "");
  const [newCat, setNewCat] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  const filteredCats = categories.filter((c) => c.type === type || type === "expense");
  const availableCats = type === "income" ? categories.filter((c) => c.type === "income" || c.name === "Salary") : categories.filter((c) => c.type === "expense");

  const canSave = amount && category && date;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: editTxn?.id,
      type, amount: Number(amount), category, date, paymentMethod, bank: bank.trim(),
      merchant: merchant.trim(), person: person.trim(), notes: notes.trim(), location: location.trim(),
    });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, background: dark ? "#141A21" : "#fff" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A" }}>{editTxn ? "Edit Transaction" : "Add Transaction"}</div>
          <button onClick={onClose} style={{ ...S.iconBtn, background: dark ? "#1A2028" : "#F1F5F9" }}>
            <X size={18} color={dark ? "#94A3B8" : "#64748B"} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => { setType("expense"); setCategory(""); }}
            style={{ ...S.typeBtn, background: type === "expense" ? "#EF444420" : "transparent", borderColor: type === "expense" ? "#EF4444" : dark ? "#293241" : "#E2E8F0", color: type === "expense" ? "#EF4444" : dark ? "#94A3B8" : "#64748B" }}
          >
            <TrendingDown size={15} /> Expense
          </button>
          <button
            onClick={() => { setType("income"); setCategory(""); }}
            style={{ ...S.typeBtn, background: type === "income" ? "#22C55E20" : "transparent", borderColor: type === "income" ? "#22C55E" : dark ? "#293241" : "#E2E8F0", color: type === "income" ? "#22C55E" : dark ? "#94A3B8" : "#64748B" }}
          >
            <TrendingUp size={15} /> Income
          </button>
        </div>

        <Field dark={dark} label="Amount">
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: dark ? "#64748B" : "#94A3B8", fontWeight: 700 }}>₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={{ ...S.input, paddingLeft: 26, background: dark ? "#1A2028" : "#F8FAFC", color: dark ? "#F1F5F9" : "#0F172A", borderColor: dark ? "#293241" : "#E2E8F0" }}
            />
          </div>
        </Field>

        <Field dark={dark} label="Category">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: showNewCat ? 8 : 0 }}>
            {availableCats.map((c) => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                style={{ ...S.catChip, background: category === c.name ? c.color : dark ? "#1A2028" : "#F1F5F9", color: category === c.name ? "#fff" : dark ? "#94A3B8" : "#64748B", borderColor: category === c.name ? c.color : "transparent" }}
              >
                {c.name}
              </button>
            ))}
            <button onClick={() => setShowNewCat(!showNewCat)} style={{ ...S.catChip, background: "transparent", border: `1px dashed ${dark ? "#475569" : "#CBD5E1"}`, color: dark ? "#64748B" : "#94A3B8" }}>
              + Custom
            </button>
          </div>
          {showNewCat && (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name" style={{ ...S.input, flex: 1, background: dark ? "#1A2028" : "#F8FAFC", color: dark ? "#F1F5F9" : "#0F172A", borderColor: dark ? "#293241" : "#E2E8F0" }} />
              <button
                onClick={() => { if (newCat.trim()) { onAddCategory(newCat.trim()); setCategory(newCat.trim()); setNewCat(""); setShowNewCat(false); } }}
                style={{ ...S.smallBtn, background: "#3B82F6" }}
              >Add</button>
            </div>
          )}
        </Field>

        <Field dark={dark} label="Date & Time">
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...S.input, background: dark ? "#1A2028" : "#F8FAFC", color: dark ? "#F1F5F9" : "#0F172A", borderColor: dark ? "#293241" : "#E2E8F0" }} />
        </Field>

        <Field dark={dark} label="Payment Method">
          <div style={{ display: "flex", gap: 6 }}>
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm}
                onClick={() => setPaymentMethod(pm)}
                style={{ ...S.catChip, flex: 1, background: paymentMethod === pm ? "#3B82F6" : dark ? "#1A2028" : "#F1F5F9", color: paymentMethod === pm ? "#fff" : dark ? "#94A3B8" : "#64748B" }}
              >
                {pm}
              </button>
            ))}
          </div>
        </Field>

        <Field dark={dark} label="Bank">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {COMMON_BANKS.map((b) => (
              <button
                key={b}
                onClick={() => setBank(bank === b ? "" : b)}
                style={{ ...S.catChip, background: bank === b ? "#3B82F6" : dark ? "#1A2028" : "#F1F5F9", color: bank === b ? "#fff" : dark ? "#94A3B8" : "#64748B" }}
              >
                {b}
              </button>
            ))}
          </div>
          <input
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            placeholder="Or type bank name (e.g. IDFC First)"
            style={{ ...S.input, background: dark ? "#1A2028" : "#F8FAFC", color: dark ? "#F1F5F9" : "#0F172A", borderColor: dark ? "#293241" : "#E2E8F0" }}
          />
        </Field>

        <Field dark={dark} label="Merchant / Shop">
          <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Dominos, Amazon" style={{ ...S.input, background: dark ? "#1A2028" : "#F8FAFC", color: dark ? "#F1F5F9" : "#0F172A", borderColor: dark ? "#293241" : "#E2E8F0" }} />
        </Field>

        <Field dark={dark} label="Person / Group">
          <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="e.g. Ravi, Gang Trip, Office" style={{ ...S.input, background: dark ? "#1A2028" : "#F8FAFC", color: dark ? "#F1F5F9" : "#0F172A", borderColor: dark ? "#293241" : "#E2E8F0" }} />
        </Field>

        <Field dark={dark} label="Location (optional)">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Koramangala, Bangalore" style={{ ...S.input, background: dark ? "#1A2028" : "#F8FAFC", color: dark ? "#F1F5F9" : "#0F172A", borderColor: dark ? "#293241" : "#E2E8F0" }} />
        </Field>

        <Field dark={dark} label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." rows={2} style={{ ...S.input, resize: "none", background: dark ? "#1A2028" : "#F8FAFC", color: dark ? "#F1F5F9" : "#0F172A", borderColor: dark ? "#293241" : "#E2E8F0" }} />
        </Field>

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{ ...S.saveBtn, opacity: canSave ? 1 : 0.5, background: type === "income" ? "#22C55E" : "#EF4444" }}
        >
          {editTxn ? "Update" : "Save"} {type === "income" ? "Income" : "Expense"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, dark }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: dark ? "#94A3B8" : "#64748B", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const S = {
  app: { minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", transition: "background 0.2s" },
  dark: { background: "#0F1419" },
  light: { background: "#F8FAFC" },
  container: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", position: "relative", paddingBottom: 80 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 16px 14px", borderBottom: "1px solid" },
  content: { padding: "14px 16px" },
  cardGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  statCard: { borderRadius: 14, padding: 12 },
  card: { borderRadius: 14, padding: 14 },
  txnRow: { display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: 10, marginBottom: 8, position: "relative", cursor: "pointer" },
  menuBtn: { display: "block", width: 100, padding: "10px 14px", background: "transparent", border: "none", textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 8px", borderTop: "1px solid", zIndex: 10 },
  navBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px" },
  fab: { width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #2563EB)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: -20, boxShadow: "0 4px 14px rgba(59,130,246,0.4)" },
  iconBtn: { width: 34, height: 34, borderRadius: 10, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 },
  modal: { width: "100%", maxWidth: 480, margin: "0 auto", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px 20px 0 0", padding: 20 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  catChip: { padding: "7px 12px", borderRadius: 20, border: "1px solid transparent", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  typeBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: "1.5px solid", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  saveBtn: { width: "100%", padding: 14, borderRadius: 12, border: "none", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 4 },
  smallBtn: { padding: "0 16px", borderRadius: 10, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  pill: { padding: "8px 14px", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  searchBox: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12 },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, fontFamily: "inherit" },
  pmChip: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 20 },
  budgetInput: { width: 90, padding: "6px 10px", borderRadius: 8, border: "1px solid", fontSize: 13, textAlign: "right", outline: "none" },
};
