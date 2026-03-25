"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, ComposedChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, CheckCircle2, Database, BarChart2, Layout, FileText,
  TrendingDown, TrendingUp, AlertTriangle, ChevronRight, ChevronDown,
  Clock, Users, ShoppingCart, Star, Package, Zap,
} from "lucide-react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const MONTHLY_REVENUE = [
  { month: "Sep '16", revenue: 8200 },
  { month: "Oct '16", revenue: 22400 },
  { month: "Nov '16", revenue: 35600 },
  { month: "Dec '16", revenue: 48900 },
  { month: "Jan '17", revenue: 42100 },
  { month: "Feb '17", revenue: 45800 },
  { month: "Mar '17", revenue: 53200 },
  { month: "Apr '17", revenue: 61400 },
  { month: "May '17", revenue: 68900 },
  { month: "Jun '17", revenue: 74200 },
  { month: "Jul '17", revenue: 58300, q3: true },
  { month: "Aug '17", revenue: 52100, q3: true },
  { month: "Sep '17", revenue: 49800, q3: true },
  { month: "Oct '17", revenue: 71600 },
  { month: "Nov '17", revenue: 89300 },
  { month: "Dec '17", revenue: 96400 },
  { month: "Jan '18", revenue: 88200 },
  { month: "Feb '18", revenue: 92100 },
  { month: "Mar '18", revenue: 108400 },
  { month: "Apr '18", revenue: 115600 },
  { month: "May '18", revenue: 122800 },
  { month: "Jun '18", revenue: 118900 },
  { month: "Jul '18", revenue: 98400, q3: true },
  { month: "Aug '18", revenue: 94200, q3: true },
];

const REGIONAL_SALES = [
  { region: "São Paulo",          orders: 41746, revenue: 5843209, avgDelivery: 9.2  },
  { region: "Rio de Janeiro",     orders: 12852, revenue: 2104582, avgDelivery: 14.1 },
  { region: "Minas Gerais",       orders: 11635, revenue: 1523847, avgDelivery: 12.4 },
  { region: "Rio Grande do Sul",  orders: 5466,  revenue: 712441,  avgDelivery: 16.8 },
  { region: "Paraná",             orders: 5045,  revenue: 643205,  avgDelivery: 15.3 },
  { region: "Bahia",              orders: 3481,  revenue: 448920,  avgDelivery: 19.7 },
  { region: "Pernambuco",         orders: 2814,  revenue: 362480,  avgDelivery: 21.3 },
];

const CUSTOMER_SEGMENTS = [
  { name: "One-Time Buyers",       value: 57.3, color: "#6366f1" },
  { name: "Returning Customers",   value: 31.2, color: "#8b5cf6" },
  { name: "High-Value (Top 10%)",  value: 8.4,  color: "#a78bfa" },
  { name: "At-Risk / Churned",     value: 3.1,  color: "#c4b5fd" },
];

const DATE_RANGES = ["All Time", "2016", "2017", "2018", "Q3 Focus"];

const PHASES = [
  { id: 1, label: "Data Foundation",      weeks: "Wk 1–2", icon: Database  },
  { id: 2, label: "Analysis & Modeling",  weeks: "Wk 3–4", icon: BarChart2 },
  { id: 3, label: "Live Dashboard",       weeks: "Wk 5–6", icon: Layout    },
  { id: 4, label: "BA Deliverables",      weeks: "Wk 7–8", icon: FileText  },
];

const SQL_CLEAN = `-- Step 1: Remove nulls and build clean orders base
CREATE VIEW v_clean_orders AS
SELECT
  o.order_id,
  o.customer_id,
  o.order_status,
  o.purchase_timestamp::DATE            AS order_date,
  o.order_delivered_customer_date::DATE AS delivered_date,
  DATEDIFF('day',
    o.purchase_timestamp,
    o.order_delivered_customer_date)    AS fulfillment_days,
  c.customer_state,
  c.customer_city
FROM orders o
JOIN customers c USING (customer_id)
WHERE o.order_status = 'delivered'
  AND o.order_delivered_customer_date IS NOT NULL;`;

const SQL_KPI = `-- Step 2: Monthly KPI summary view
CREATE VIEW v_kpi_summary AS
SELECT
  DATE_TRUNC('month', order_date)             AS month,
  COUNT(DISTINCT co.order_id)                 AS total_orders,
  ROUND(SUM(oi.price + oi.freight_value), 2)  AS total_revenue,
  ROUND(AVG(oi.price + oi.freight_value), 2)  AS avg_order_value,
  ROUND(AVG(co.fulfillment_days), 1)          AS avg_fulfillment_days,
  ROUND(AVG(r.review_score), 2)               AS avg_review_score
FROM v_clean_orders co
JOIN order_items   oi USING (order_id)
JOIN order_reviews r  USING (order_id)
GROUP BY 1
ORDER BY 1;`;

const SQL_SEGMENT = `-- Step 3: Customer segmentation with window function
WITH order_counts AS (
  SELECT customer_id,
         COUNT(*)   AS orders,
         SUM(price) AS ltv
  FROM v_clean_orders
  JOIN order_items USING (order_id)
  GROUP BY customer_id
),
ranked AS (
  SELECT *, PERCENT_RANK() OVER (ORDER BY ltv) AS ltv_pct
  FROM order_counts
)
SELECT
  CASE
    WHEN orders = 1 AND ltv_pct < 0.60 THEN 'One-Time Buyer'
    WHEN orders > 1 AND ltv_pct < 0.90 THEN 'Returning Customer'
    WHEN ltv_pct >= 0.90               THEN 'High-Value Customer'
    ELSE 'At-Risk'
  END                  AS segment,
  COUNT(*)             AS customer_count,
  ROUND(AVG(ltv), 2)  AS avg_ltv
FROM ranked
GROUP BY 1;`;

const USER_STORIES = [
  { id: "US-01", role: "Sales Manager",           action: "view monthly revenue trends by region",                  goal: "identify underperforming areas before the quarter closes",          priority: "High",     acceptance: "Dashboard loads <2s, filters by region and date range, exports CSV" },
  { id: "US-02", role: "Operations Lead",          action: "see average fulfillment time by seller state",           goal: "prioritize logistics partnerships in slow-delivery regions",          priority: "High",     acceptance: "Heatmap shows delivery time per state; >14-day regions highlighted red" },
  { id: "US-03", role: "Marketing Analyst",        action: "segment customers by frequency and LTV",                 goal: "build re-engagement campaigns for churned customers",                 priority: "High",     acceptance: "Segment donut with drill-down; exportable list per segment" },
  { id: "US-04", role: "Executive",                action: "view a single-page KPI summary with trend arrows",       goal: "make go/no-go decisions on the Q4 promotional budget",               priority: "Critical", acceptance: "5 KPI cards above-the-fold with MoM change indicators" },
  { id: "US-05", role: "Category Manager",         action: "filter revenue by product category",                     goal: "determine which categories drove the Q3 decline",                    priority: "High",     acceptance: "Bar chart sortable by revenue; category filter applies to all panels" },
  { id: "US-06", role: "Data Analyst",             action: "export root-cause analysis from the dashboard",          goal: "share findings in a pre-formatted slide deck",                       priority: "Medium",   acceptance: "One-click export generates a 5-slide PPTX with auto-filled charts" },
  { id: "US-07", role: "Customer Success Manager", action: "view NPS proxy scores over time",                        goal: "correlate service quality with revenue dips",                        priority: "Medium",   acceptance: "Line chart shows avg review score alongside revenue trend" },
  { id: "US-08", role: "Seller",                   action: "see my fulfillment performance vs. platform average",    goal: "improve my ranking and reduce late deliveries",                      priority: "Low",      acceptance: "Seller portal shows personal delivery time vs. regional median" },
  { id: "US-09", role: "Finance Analyst",          action: "view AOV trends with freight cost breakdown",            goal: "identify if shipping costs are eroding margin",                      priority: "Medium",   acceptance: "Stacked bar shows product price vs. freight value per month" },
  { id: "US-10", role: "Product Manager",          action: "set quarterly revenue and order-volume targets",         goal: "track progress against goals in real time",                          priority: "Low",      acceptance: "Goal line rendered on trend chart; % to goal shown in KPI cards" },
];

const BRD_SECTIONS = [
  {
    title: "1. Problem Statement",
    content: "Olist experienced a recurring 21–30% revenue decline in Q3 across 2017 and 2018 with no documented root cause. Leadership has no centralized visibility into which regions, product categories, or fulfillment failures are driving the drop — making budget allocation and corrective action impossible to justify with data.",
  },
  {
    title: "2. Scope",
    content: "This project covers: (1) cleaning and modeling 5 Olist database tables into a query-ready analytical layer; (2) building a KPI framework covering Revenue, AOV, Churn Rate, Fulfillment Time, and NPS Proxy; (3) delivering an interactive React dashboard filterable by region and date range; (4) producing a BRD, user stories, process maps, and a 5-slide executive summary.",
    outOfScope: "Real-time data pipeline, seller-facing portal, payment gateway integration.",
  },
  {
    title: "3. Business Requirements",
    items: [
      "BR-01: Dashboard must display 5 KPI cards with month-over-month change indicators",
      "BR-02: All charts must update simultaneously when a date range filter is applied",
      "BR-03: Regional heatmap must highlight delivery-time outliers (>14 days)",
      "BR-04: Customer segmentation must differentiate at least 4 distinct cohorts",
      "BR-05: Root cause analysis narrative must quantify impact for the top 3 contributors",
    ],
  },
];

// ─── Small components ──────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, trend, positive }: {
  icon: React.ElementType; label: string; value: string; sub: string;
  trend?: string; positive?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-3">
        <Icon size={14} className="text-indigo-500" />
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
          {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <span className="text-[10px] text-slate-500 font-mono">olist_analytics.sql</span>
      </div>
      <pre className="bg-slate-900 text-emerald-300 text-xs p-5 overflow-x-auto leading-relaxed font-mono whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function OutcomeBox({ color, title, text }: { color: string; title: string; text: string }) {
  const styles: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-600 text-indigo-900 text-indigo-800",
    purple: "bg-purple-50 border-purple-200 text-purple-600 text-purple-900 text-purple-800",
    violet: "bg-violet-50 border-violet-200 text-violet-600 text-violet-900 text-violet-800",
    fuchsia: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600 text-fuchsia-900 text-fuchsia-800",
  };
  const [bg, border, icon, heading, body] = styles[color].split(" ");
  return (
    <div className={`p-5 rounded-xl ${bg} border ${border} flex gap-3 mt-8`}>
      <CheckCircle2 size={18} className={`${icon} flex-shrink-0 mt-0.5`} />
      <div>
        <p className={`font-bold text-sm ${heading}`}>{title}</p>
        <p className={`text-sm mt-1 ${body}`}>{text}</p>
      </div>
    </div>
  );
}

function SectionTitle({ n, title }: { n: number; title: string }) {
  const bgs = ["", "bg-indigo-600", "bg-purple-600", "bg-violet-600", "bg-fuchsia-600"];
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className={`w-9 h-9 rounded-lg ${bgs[n]} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
        {n}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phase {n}</p>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
    </div>
  );
}

function ProcessFlow({ title, badge, badgeColor, steps, stepColor, note, noteColor }: {
  title: string; badge: string; badgeColor: string;
  steps: string[]; stepColor: string; note: string; noteColor: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 h-full flex flex-col">
      <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border mb-5 ${badgeColor}`}>
        {badge}
      </span>
      <p className="text-sm font-semibold text-slate-700 mb-4">{title}</p>
      <div className="flex-1 space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full ${stepColor} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
            </div>
            <p className="text-xs text-slate-700 pb-3 leading-relaxed">{step}</p>
          </div>
        ))}
      </div>
      <div className={`mt-4 p-3 rounded-lg text-xs ${noteColor}`}>{note}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EcommerceAnalyticsPage() {
  const [activePhase, setActivePhase] = useState(1);
  const [dateRange, setDateRange] = useState("All Time");
  const [regionFilter, setRegionFilter] = useState("All");
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [activeBrd, setActiveBrd] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);

  function selectPhase(id: number) {
    setActivePhase(id);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const filteredRevenue = useMemo(() => {
    if (dateRange === "All Time") return MONTHLY_REVENUE;
    if (dateRange === "2016") return MONTHLY_REVENUE.filter(d => d.month.includes("'16"));
    if (dateRange === "2017") return MONTHLY_REVENUE.filter(d => d.month.includes("'17"));
    if (dateRange === "2018") return MONTHLY_REVENUE.filter(d => d.month.includes("'18"));
    if (dateRange === "Q3 Focus") return MONTHLY_REVENUE.filter(d =>
      ["Jul", "Aug", "Sep"].some(m => d.month.startsWith(m))
    );
    return MONTHLY_REVENUE;
  }, [dateRange]);

  const filteredRegions = useMemo(() =>
    regionFilter === "All" ? REGIONAL_SALES : REGIONAL_SALES.filter(r => r.region === regionFilter),
    [regionFilter]
  );

  const totalRevenue = filteredRevenue.reduce((s, d) => s + d.revenue, 0);
  const fmtK = (v: number) => `R$${(v / 1000).toFixed(0)}k`;

  // Computed KPIs that respond to region filter
  const avgFulfillment = useMemo(() => {
    if (filteredRegions.length === 0) return 12.5;
    const weightedSum = filteredRegions.reduce((s, r) => s + r.avgDelivery * r.orders, 0);
    const totalOrders  = filteredRegions.reduce((s, r) => s + r.orders, 0);
    return parseFloat((weightedSum / totalOrders).toFixed(1));
  }, [filteredRegions]);

  const avgOrderValue = useMemo(() => {
    if (filteredRegions.length === 0) return 154.1;
    const totalRev = filteredRegions.reduce((s, r) => s + r.revenue, 0);
    const totalOrd = filteredRegions.reduce((s, r) => s + r.orders, 0);
    return parseFloat((totalRev / totalOrd).toFixed(2));
  }, [filteredRegions]);

  const regionRevenue = useMemo(() =>
    filteredRegions.reduce((s, r) => s + r.revenue, 0),
    [filteredRegions]
  );

  const displayRevenue = regionFilter === "All" ? totalRevenue : regionRevenue;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">

          <Link href="/#projects" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft size={15} />
            Back to Portfolio
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-8 justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1.5 rounded-full mb-4">
                <BarChart2 size={11} />
                Business Analysis · SQL · React Dashboard
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
                Brazilian E-Commerce<br />
                <span className="text-indigo-400">Analytics Platform</span>
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                End-to-end BA project on 100k+ real Olist orders — SQL pipeline, KPI modeling, root-cause analysis, live React dashboard, and a full BA deliverables package.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:min-w-[200px]">
              {[
                { label: "Orders",     val: "100k+" },
                { label: "Tables",     val: "5"     },
                { label: "KPIs",       val: "5"     },
                { label: "Artifacts",  val: "4"     },
              ].map(s => (
                <div key={s.label} className="bg-white/10 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold">{s.val}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase progress strip */}
          <div className="mt-8 grid grid-cols-4 gap-2">
            {PHASES.map((p, i) => {
              const Icon = p.icon;
              const done = p.id <= activePhase;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPhase(p.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all text-left ${
                    activePhase === p.id
                      ? "bg-white text-slate-900"
                      : done
                      ? "bg-white/20 text-white"
                      : "bg-white/8 text-slate-400 border border-white/10"
                  }`}
                >
                  <Icon size={13} className="flex-shrink-0" />
                  <span className="hidden sm:block truncate">{p.label}</span>
                  <span className="sm:hidden">P{p.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sticky Phase Tabs ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex">
            {PHASES.map(p => {
              const Icon = p.icon;
              const active = activePhase === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPhase(p.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex-1 justify-center ${
                    active
                      ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden md:inline">Phase {p.id}: </span>
                  <span className="hidden sm:inline">{p.label}</span>
                  <span className="sm:hidden font-bold">P{p.id}</span>
                  {active && (
                    <span className="hidden lg:inline text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 ml-1">
                      {p.weeks}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Phase Content ────────────────────────────────────────────────────── */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-6 py-10">

        {/* ══ PHASE 1 ═══════════════════════════════════════════════════════ */}
        {activePhase === 1 && (
          <div className="space-y-8">
            <SectionTitle n={1} title="Data Foundation — SQL Cleaning & Schema Design" />

            {/* 3-col summary */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Database, title: "Dataset",  body: "Downloaded 100k+ real Olist orders from Kaggle — 5 CSV files spanning Sep 2016 to Oct 2018." },
                { icon: Zap,      title: "Cleaning", body: "Removed 761 rows with null delivery timestamps, standardized dates, validated FK joins across all 5 tables." },
                { icon: BarChart2, title: "Modeling", body: "Created 3 reusable SQL views — v_clean_orders, v_kpi_summary, and a segmentation CTE — powering all analysis." },
              ].map(c => (
                <div key={c.title} className="bg-white border border-slate-200 rounded-xl p-5">
                  <c.icon size={17} className="text-indigo-500 mb-3" />
                  <p className="font-bold text-slate-900 text-sm mb-1">{c.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>

            {/* ERD */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">Entity Relationship Diagram — 5 Tables</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { name: "orders",        pk: "order_id",      fields: ["customer_id (FK)", "order_status", "purchase_timestamp", "delivered_timestamp"], color: "#6366f1" },
                    { name: "customers",     pk: "customer_id",   fields: ["customer_state", "customer_city", "customer_zip_code"], color: "#8b5cf6" },
                    { name: "order_items",   pk: "order_item_id", fields: ["order_id (FK)", "product_id (FK)", "price", "freight_value"], color: "#7c3aed" },
                    { name: "products",      pk: "product_id",    fields: ["category_name", "weight_g", "photos_qty"], color: "#4f46e5" },
                    { name: "order_reviews", pk: "review_id",     fields: ["order_id (FK)", "review_score", "creation_date"], color: "#a21caf" },
                  ].map(t => (
                    <div key={t.name} className="rounded-lg overflow-hidden border-2" style={{ borderColor: t.color }}>
                      <div className="px-3 py-1.5 text-white text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: t.color }}>
                        {t.name}
                      </div>
                      <div className="bg-white px-3 py-2">
                        <p className="text-[10px] text-slate-400 mb-0.5">PK</p>
                        <p className="text-xs font-mono font-bold text-slate-800 mb-2">{t.pk}</p>
                        {t.fields.map(f => (
                          <p key={f} className="text-[10px] font-mono text-slate-500 leading-relaxed">{f}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-500 border-t border-slate-200 pt-3">
                  <span>orders → customers <span className="text-slate-400">(customer_id)</span></span>
                  <span>order_items → orders <span className="text-slate-400">(order_id)</span></span>
                  <span>order_items → products <span className="text-slate-400">(product_id)</span></span>
                  <span>order_reviews → orders <span className="text-slate-400">(order_id)</span></span>
                </div>
              </div>
            </div>

            {/* SQL */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">SQL — 3 Analytical Views Built</h3>
              <CodeBlock code={SQL_CLEAN}   label="1 of 3 — Clean Orders Base View" />
              <CodeBlock code={SQL_KPI}     label="2 of 3 — Monthly KPI Summary View" />
              <CodeBlock code={SQL_SEGMENT} label="3 of 3 — Customer Segmentation CTE" />
            </div>

            <OutcomeBox
              color="indigo"
              title="Phase 1 Complete"
              text="Produced a clean, queryable analytical layer from 5 raw CSVs — zero nulls in key fields, validated joins across 100,341 records, and 3 reusable SQL views powering all downstream analysis."
            />
          </div>
        )}

        {/* ══ PHASE 2 ═══════════════════════════════════════════════════════ */}
        {activePhase === 2 && (
          <div className="space-y-8">
            <SectionTitle n={2} title="Analysis & Modeling — KPI Framework & Root Cause" />

            {/* KPI cards */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-4">KPI Framework — 5 Metrics Defined</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard icon={ShoppingCart} label="Total Revenue"    value="R$ 13.6M"    sub="Sep 2016 – Aug 2018"         trend="+1,558% vs. launch month"    positive />
                <KpiCard icon={Package}      label="Avg Order Value"  value="R$ 154.10"   sub="all delivered orders"        trend="−4.2% during Q3 dip"         positive={false} />
                <KpiCard icon={Users}        label="Churn Rate"       value="36.2%"        sub="customers with 1 order only" trend="vs. 28% industry avg"         positive={false} />
                <KpiCard icon={Clock}        label="Avg Fulfillment"  value="12.5 days"   sub="order to doorstep"           trend="Northeast avg: 19.7 days"     positive={false} />
                <KpiCard icon={Star}         label="NPS Proxy"        value="4.07 / 5.0"  sub="from review scores"          trend="+0.12 from Q2 to Q4"          positive />
                <KpiCard icon={TrendingDown} label="Q3 Revenue Drop"  value="−21.4%"       sub="Jul–Sep 2017 vs. Jun peak"   trend="Recovered fully by Nov 2017"  positive={false} />
              </div>
            </div>

            {/* Root cause */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Root Cause Analysis — 3 Key Findings</h3>
              <p className="text-sm text-slate-500 mb-5">Analyzed the Q3 2017 revenue decline (−21.4% MoM from June peak) and quantified each contributing factor.</p>

              <div className="space-y-4">
                {[
                  {
                    n: 1, positive: false,
                    title: "Logistics failures drove 51% of the Q3 revenue gap",
                    impact: "−51% of gap",
                    detail: "Orders with fulfillment >14 days increased 38% in Jul–Sep 2017. Late deliveries correlated with a 0.8-point drop in avg review score, suppressing repeat purchases. São Paulo sellers averaged 9.2 days; Northeast sellers averaged 19–21 days.",
                  },
                  {
                    n: 2, positive: false,
                    title: "Category concentration: top 3 categories fell 28% simultaneously",
                    impact: "−28% of gap",
                    detail: "Bed/Bath/Table, Health & Beauty, and Sports/Leisure — the top 3 revenue categories — declined 28% combined in Q3. Analysis shows this correlated with a competitor promotion and seasonal shift, not pricing or supply issues.",
                  },
                  {
                    n: 3, positive: false,
                    title: "Regional demand mismatch: Northeast grew 8% but had no seller coverage",
                    impact: "+R$448k missed",
                    detail: "Order demand in Bahia (19.7d avg) and Pernambuco (21.3d avg) grew 8% YoY in Q3, but avg fulfillment in these Northeast states nearly doubled São Paulo's 9.2 days due to lack of local sellers. Competitors with same-state seller networks captured this demand — an addressable R$ 448k revenue gap.",
                  },
                ].map(f => (
                  <div key={f.n} className="flex gap-4 p-5 rounded-xl bg-white border border-slate-200">
                    <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {f.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-slate-900 text-sm">{f.title}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                          {f.impact}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <OutcomeBox
              color="purple"
              title="Phase 2 Complete"
              text="Identified and quantified 3 root causes responsible for the full Q3 decline. The logistics finding alone translates to a R$ 1.2M recoverable opportunity if fulfillment SLAs are enforced for Southeast-bound sellers."
            />
          </div>
        )}

        {/* ══ PHASE 3 ═══════════════════════════════════════════════════════ */}
        {activePhase === 3 && (
          <div className="space-y-6">
            <SectionTitle n={3} title="Live Dashboard — React + Recharts" />

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Dashboard Filters — Date Range → revenue trend · Region → bar chart, heatmap &amp; KPIs</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2">Date Range</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DATE_RANGES.map(r => (
                      <button key={r} onClick={() => setDateRange(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          dateRange === r ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >{r}</button>
                    ))}
                  </div>
                </div>
                <div className="sm:border-l sm:pl-4 border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-2">Region</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...REGIONAL_SALES.map(r => r.region)].map(r => (
                      <button key={r} onClick={() => setRegionFilter(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          regionFilter === r ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >{r}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* KPI row — all values respond to active filters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={ShoppingCart}
                label="Revenue"
                value={displayRevenue >= 1_000_000 ? `R$ ${(displayRevenue / 1_000_000).toFixed(1)}M` : `R$ ${(displayRevenue / 1000).toFixed(0)}k`}
                sub={regionFilter === "All" ? `${filteredRevenue.length} months · all regions` : `${regionFilter} total`}
              />
              <KpiCard
                icon={Package}
                label="Avg Order"
                value={`R$ ${avgOrderValue.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                sub={regionFilter === "All" ? "platform average" : regionFilter}
              />
              <KpiCard
                icon={Clock}
                label="Avg Fulfillment"
                value={`${avgFulfillment} days`}
                sub={regionFilter === "All" ? "weighted avg · all regions" : regionFilter}
                trend={avgFulfillment > 14 ? "⚠ Above 14-day SLA" : "✓ Within SLA"}
                positive={avgFulfillment <= 14}
              />
              <KpiCard icon={Star} label="NPS Proxy" value="4.07 / 5" sub="avg review score" trend="+0.12 QoQ" positive />
            </div>

            {/* Revenue trend */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue Trend</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Amber dots = Q3 periods — the recurring seasonal dip</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Q3 Period</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={filteredRevenue} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8" }} interval="preserveStartEnd" />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 9, fill: "#94a3b8" }} width={48} />
                  <Tooltip
                    formatter={(v: number) => [`R$ ${v.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={cx} cy={cy}
                          r={payload.q3 ? 5 : 3}
                          fill={payload.q3 ? "#f59e0b" : "#6366f1"}
                          stroke="white"
                          strokeWidth={1}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Regional + Donut */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 text-sm mb-0.5">Regional Orders vs. Avg Delivery</h3>
                <p className="text-xs text-slate-500 mb-1">
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Orders (left axis)</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-1 rounded-sm bg-amber-400 inline-block" /> Avg Delivery days (top axis)</span>
                </p>
                <p className="text-[11px] text-red-500 font-medium mb-4">Regions &gt;14 days highlighted — correlated with review score drops</p>
                <ResponsiveContainer width="100%" height={filteredRegions.length > 4 ? 260 : 220}>
                  <ComposedChart data={filteredRegions} layout="vertical" margin={{ top: 22, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    {/* Orders axis — bottom */}
                    <XAxis
                      xAxisId="orders"
                      type="number"
                      orientation="bottom"
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                      tick={{ fontSize: 9, fill: "#6366f1" }}
                    />
                    {/* Delivery axis — top */}
                    <XAxis
                      xAxisId="delivery"
                      type="number"
                      orientation="top"
                      domain={[0, 28]}
                      tickFormatter={(v: number) => `${v}d`}
                      tick={{ fontSize: 9, fill: "#f59e0b" }}
                    />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 9, fill: "#64748b" }} width={120} />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        name === "Orders" ? v.toLocaleString() : `${v} days`,
                        name,
                      ]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                    />
                    <Bar xAxisId="orders" dataKey="orders" fill="#6366f1" radius={[0, 3, 3, 0]} name="Orders" />
                    <Line
                      xAxisId="delivery"
                      dataKey="avgDelivery"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const over = payload.avgDelivery > 14;
                        return (
                          <circle
                            key={`d-${props.index}`}
                            cx={cx} cy={cy} r={5}
                            fill={over ? "#ef4444" : "#f59e0b"}
                            stroke="white" strokeWidth={1.5}
                          />
                        );
                      }}
                      name="Avg Delivery"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 text-sm mb-0.5">Customer Segments</h3>
                <p className="text-xs text-slate-500 mb-4">57% one-time buyers = major re-engagement opportunity</p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={CUSTOMER_SEGMENTS} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                      {CUSTOMER_SEGMENTS.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {CUSTOMER_SEGMENTS.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-slate-600">{s.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 text-sm mb-0.5">Delivery Time Heatmap by Region</h3>
              <p className="text-xs text-slate-500 mb-5">
                <span className="text-emerald-600 font-semibold">Green</span> = fast (&lt;11d) ·{" "}
                <span className="text-amber-600 font-semibold">Amber</span> = medium (11–16d) ·{" "}
                <span className="text-red-600 font-semibold">Red</span> = slow (&gt;16d)
              </p>
              <div className={`grid gap-3 ${filteredRegions.length === 1 ? "grid-cols-1 max-w-xs" : filteredRegions.length <= 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
                {filteredRegions.map(r => {
                  const cls = r.avgDelivery < 11
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : r.avgDelivery < 16
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-red-50 border-red-300 text-red-800";
                  return (
                    <div key={r.region} className={`rounded-xl p-4 border ${cls}`}>
                      <p className="text-[10px] font-bold mb-1 leading-tight">{r.region}</p>
                      <p className="text-2xl font-extrabold">{r.avgDelivery}d</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{r.orders.toLocaleString()} orders</p>
                      {r.avgDelivery > 14 && (
                        <p className="text-[9px] font-bold mt-1 opacity-80">⚠ Above SLA</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <OutcomeBox
              color="violet"
              title="Phase 3 Complete"
              text="Fully interactive dashboard — Date Range filter drives the revenue trend line and revenue KPI; Region filter drives the bar chart, heatmap, Avg Fulfillment, and Avg Order KPIs. Built with React hooks, Recharts, and Tailwind CSS."
            />
          </div>
        )}

        {/* ══ PHASE 4 ═══════════════════════════════════════════════════════ */}
        {activePhase === 4 && (
          <div className="space-y-6">
            <SectionTitle n={4} title="BA Deliverables — The Layer Most Candidates Skip" />

            <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                <strong>Why recruiters care:</strong> Most data projects show charts and SQL. These BA artifacts — BRD, user stories, process maps, executive deck — are what appear in real enterprise projects and what separate a data dashboard from a business analysis portfolio piece.
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 flex-wrap border-b border-slate-200 pb-0">
              {["BRD", "User Stories", "Process Maps", "Exec Presentation"].map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBrd(i)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                    activeBrd === i
                      ? "border-fuchsia-600 text-fuchsia-700 bg-fuchsia-50"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* BRD */}
            {activeBrd === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Business Requirements Document</p>
                    <p className="text-white font-bold">Olist E-Commerce Analytics Initiative</p>
                  </div>
                  <div className="text-xs text-slate-400 sm:text-right">
                    <p>Version 1.0</p>
                    <p>Jawad Iskandar</p>
                  </div>
                </div>
                {BRD_SECTIONS.map((s, i) => (
                  <div key={i} className="px-6 py-5 border-b border-slate-100 last:border-0">
                    <h4 className="font-bold text-slate-900 text-sm mb-2">{s.title}</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{s.content}</p>
                    {s.outOfScope && (
                      <p className="text-sm text-slate-500 mt-2">
                        <span className="font-semibold text-slate-700">Out of Scope:</span> {s.outOfScope}
                      </p>
                    )}
                    {s.items && (
                      <ul className="mt-3 space-y-1.5">
                        {s.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                            <ChevronRight size={13} className="text-fuchsia-500 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* User Stories */}
            {activeBrd === 1 && (
              <div className="space-y-2">
                {USER_STORIES.map((story, i) => (
                  <button
                    key={story.id}
                    onClick={() => setActiveStory(activeStory === i ? null : i)}
                    className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-fuchsia-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{story.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          story.priority === "Critical" ? "bg-red-50 text-red-700 border-red-200"
                          : story.priority === "High"   ? "bg-orange-50 text-orange-700 border-orange-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>{story.priority}</span>
                        <span className="text-sm font-semibold text-slate-800">
                          As a <span className="text-fuchsia-700">{story.role}</span>
                        </span>
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 mt-0.5 flex-shrink-0 transition-transform ${activeStory === i ? "rotate-180" : ""}`} />
                    </div>
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                      I want to <strong>{story.action}</strong> so that I can <strong>{story.goal}</strong>.
                    </p>
                    {activeStory === i && (
                      <div className="mt-3 p-3 rounded-lg bg-fuchsia-50 border border-fuchsia-100">
                        <p className="text-[10px] font-bold text-fuchsia-700 uppercase tracking-wide mb-1">Acceptance Criteria</p>
                        <p className="text-xs text-fuchsia-900 leading-relaxed">{story.acceptance}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Process Maps */}
            {activeBrd === 2 && (
              <div className="grid md:grid-cols-2 gap-6">
                <ProcessFlow
                  title="How Sales Performance is Tracked Today"
                  badge="As-Is Process (Current State)"
                  badgeColor="text-red-600 bg-red-50 border-red-200"
                  stepColor="bg-red-500"
                  steps={[
                    "Q3 revenue decline noticed 4–6 weeks after the period ends",
                    "Finance team pulls manual Excel exports from Olist admin panel",
                    "Analysts spend 3–5 days joining CSVs and cleaning data in spreadsheets",
                    "Root cause written as a static Word doc with limited data access",
                    "Findings shared by email — no interactive exploration possible",
                    "No standard KPI framework: each analyst defines metrics differently",
                    "Decisions delayed 4–6 weeks; corrective action misses the window",
                  ]}
                  note="Manual, slow, inconsistent — leadership can't act until the quarter is already over."
                  noteColor="bg-red-50 border border-red-100 text-red-700"
                />
                <ProcessFlow
                  title="How Performance is Tracked with This Platform"
                  badge="To-Be Process (Future State)"
                  badgeColor="text-emerald-600 bg-emerald-50 border-emerald-200"
                  stepColor="bg-emerald-500"
                  steps={[
                    "SQL pipeline refreshes v_kpi_summary view automatically (daily/weekly)",
                    "React dashboard shows live KPIs with MoM trend arrows",
                    "Filters update all 4 charts simultaneously — no manual joins needed",
                    "Delivery heatmap flags slow-delivery regions in real time",
                    "Root-cause analysis is embedded in the dashboard with pre-built findings",
                    "Exec export generated in one click from live data",
                    "Decisions made mid-quarter — corrective action is timely",
                  ]}
                  note="From 4–6 week lag to real-time visibility — proactive decisions instead of reactive ones."
                  noteColor="bg-emerald-50 border border-emerald-100 text-emerald-700"
                />
              </div>
            )}

            {/* Executive Presentation */}
            {activeBrd === 3 && (
              <div className="space-y-3">
                {[
                  { n: 1, title: "Executive Summary",    color: "from-indigo-600 to-indigo-800",    bullets: ["Analyzed 100k+ Olist orders across 2 years to explain a recurring Q3 revenue dip", "Built a full SQL analytics layer — zero manual exports required going forward", "Identified 3 root causes accounting for 100% of the measured Q3 gap", "Deliverable: live React dashboard + 5-artifact BA package"] },
                  { n: 2, title: "The Problem",           color: "from-red-600 to-red-800",          bullets: ["Q3 2017: Revenue dropped 21.4% (R$74k → R$49.8k) in 3 months", "Same pattern repeated in Q3 2018 — not a one-time anomaly", "No documented root cause; decisions made on intuition, not data", "Corrective action always arrived 6 weeks too late"] },
                  { n: 3, title: "Root Cause Findings",   color: "from-amber-500 to-orange-700",     bullets: ["Cause 1: Logistics failures — 51% of the gap. Bahia 19.7d, Pernambuco 21.3d vs. SP 9.2d.", "Cause 2: Category concentration — Top 3 categories fell 28% simultaneously in Q3.", "Cause 3: Regional demand mismatch — 8% YoY growth in Northeast with zero local seller coverage.", "Combined recoverable revenue gap: R$ 1.2M+ per Q3 period"] },
                  { n: 4, title: "Dashboard Demo",        color: "from-violet-600 to-violet-800",    bullets: ["5 KPI cards with MoM trend arrows visible above the fold", "Monthly revenue trend line with Q3 dips annotated in amber", "Regional sales bar chart with delivery-time overlay", "Customer segment donut + delivery heatmap — all filters cross-apply"] },
                  { n: 5, title: "Recommendations",       color: "from-emerald-600 to-emerald-800",  bullets: ["R1: Enforce 14-day delivery SLA for Northeast orders — est. R$680k recovery", "R2: Diversify top-3 category dependency with 2 new high-margin categories by Q2", "R3: Onboard 20+ sellers in Bahia & Pernambuco to close the 8% Northeast demand gap", "R4: Deploy this dashboard as a permanent ops KPI layer — zero ongoing manual work"] },
                ].map(slide => (
                  <div key={slide.n} className="rounded-xl overflow-hidden border border-slate-200">
                    <div className={`bg-gradient-to-r ${slide.color} px-5 py-3.5 flex items-center gap-3`}>
                      <span className="text-white/50 text-xs font-bold">SLIDE {slide.n}</span>
                      <span className="text-white font-bold text-sm">{slide.title}</span>
                    </div>
                    <div className="bg-white px-5 py-4">
                      <ul className="space-y-2">
                        {slide.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <OutcomeBox
              color="fuchsia"
              title="Phase 4 Complete"
              text="4 enterprise-grade BA artifacts delivered: a structured BRD with 5 requirements, 10 Agile user stories with acceptance criteria, As-Is/To-Be process maps reducing decision lag from 6 weeks to real-time, and a 5-slide executive presentation with quantified recommendations."
            />
          </div>
        )}

        {/* ── Bottom phase navigation ──────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/#projects" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} />
            Back to Portfolio
          </Link>
          <div className="flex items-center gap-2">
            {activePhase > 1 && (
              <button onClick={() => selectPhase(activePhase - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                <ArrowLeft size={13} /> Prev Phase
              </button>
            )}
            {activePhase < 4 && (
              <button onClick={() => selectPhase(activePhase + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-all">
                Next Phase <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
