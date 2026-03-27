import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface Person {
  Name: string;
  Age: number;
  ShoeSize: number;
  Gender: string;
  Children: Person[];
  HøjdeData?: Record<number, number>;
}

const lars: Person = {
  Name: "Lars",
  Age: 15,
  ShoeSize: 46,
  Gender: "M",
  Children: [],
  HøjdeData: {
    0: 50,
    1: 75,
    2: 82,
    3: 89,
    4: 95,
    5: 101,
    6: 107,
    7: 112.5,
    8: 118,
    9: 123.5,
    10: 129,
    11: 134.5,
    12: 140,
    13: 149.5,
    14: 159,
    15: 168.5,
  },
};
const iben: Person = {
  Name: "Iben",
  Age: 26,
  ShoeSize: 38,
  Gender: "F",
  Children: [],
};
const bente: Person = {
  Name: "Bente",
  Age: 46,
  ShoeSize: 37,
  Gender: "F",
  Children: [lars],
};
const viggo: Person = {
  Name: "Viggo",
  Age: 47,
  ShoeSize: 42,
  Gender: "M",
  Children: [iben],
};
const henning: Person = {
  Name: "Henning",
  Age: 65,
  ShoeSize: 44,
  Gender: "M",
  Children: [viggo, bente],
};

/* ── helpers ── */

/** Collect all unique members from the tree, guarding against cycles. */
function collectAllMembers(
  person: Person,
  visited = new Set<Person>()
): Person[] {
  if (visited.has(person)) return [];
  visited.add(person);
  const result: Person[] = [person];
  for (const child of person.Children ?? []) {
    result.push(...collectAllMembers(child, visited));
  }
  return result;
}

/** Simple linear regression: returns slope and intercept. */
function linearRegression(
  points: { x: number; y: number }[]
): { slope: number; intercept: number } {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/* ── 1. Family Tree ── */

interface FamilyNodeProps {
  person: Person;
  /** ancestors already in this render path — used to prevent infinite loops */
  ancestorSet?: Set<Person>;
}

function FamilyNode({ person, ancestorSet = new Set() }: FamilyNodeProps) {
  const [expanded, setExpanded] = useState(true);

  const safeChildren = (person.Children ?? []).filter(
    (c) => !ancestorSet.has(c)
  );
  const hasChildren = safeChildren.length > 0;

  const nextAncestors = new Set(ancestorSet);
  nextAncestors.add(person);

  const genderColor = person.Gender === "F" ? "#e91e8c" : "#1e90ff";

  return (
    <div style={{ margin: "6px 0 6px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {hasChildren ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: "none",
              border: "1px solid #ccc",
              borderRadius: 4,
              cursor: "pointer",
              width: 22,
              height: 22,
              lineHeight: "20px",
              textAlign: "center",
              padding: 0,
            }}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "−" : "+"}
          </button>
        ) : (
          <span style={{ display: "inline-block", width: 22 }} />
        )}
        <span
          style={{
            fontWeight: "bold",
            color: genderColor,
          }}
        >
          {person.Name}
        </span>
        <span style={{ color: "#555", fontSize: 13 }}>
          (Age: {person.Age}, Shoe: {person.ShoeSize})
        </span>
      </div>
      {expanded && hasChildren && (
        <div style={{ borderLeft: "2px solid #ddd", marginLeft: 10 }}>
          {safeChildren.map((child) => (
            <FamilyNode
              key={child.Name}
              person={child}
              ancestorSet={nextAncestors}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 2. Age Bar Chart ── */

function AgeBarChart({ root }: { root: Person }) {
  const members = collectAllMembers(root);
  const data = members.map((m) => ({ name: m.Name, Age: m.Age }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis unit=" yr" />
        <Tooltip />
        <Legend />
        <Bar dataKey="Age" fill="#4a90d9" name="Age (years)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 3. Average Shoe Size per Gender ── */

function AvgShoeSize({ root }: { root: Person }) {
  const members = collectAllMembers(root);

  const groups: Record<string, number[]> = {};
  for (const m of members) {
    const g = m.Gender ?? "Unknown";
    if (!groups[g]) groups[g] = [];
    groups[g].push(m.ShoeSize);
  }

  const rows = Object.entries(groups).map(([gender, sizes]) => {
    const avg = sizes.reduce((s, v) => s + v, 0) / sizes.length;
    return { gender: gender === "M" ? "Male" : gender === "F" ? "Female" : gender, avg };
  });

  const data = rows.map((r) => ({ name: r.gender, "Avg Shoe Size": +r.avg.toFixed(1) }));

  return (
    <div>
      <table
        style={{
          borderCollapse: "collapse",
          marginBottom: 16,
          minWidth: 240,
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={thStyle}>Gender</th>
            <th style={thStyle}>Avg Shoe Size</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.gender}>
              <td style={tdStyle}>{r.gender}</td>
              <td style={tdStyle}>{r.avg.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[30, 50]} />
          <Tooltip />
          <Bar dataKey="Avg Shoe Size" fill="#e67e22" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "6px 14px",
  textAlign: "left",
};
const tdStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "6px 14px",
};

/* ── 4. Lars growth + forecast ── */

function LarsGrowthChart({ person }: { person: Person }) {
  const rawData = person.HøjdeData;
  if (!rawData) return <p>No height data available.</p>;

  const measured = Object.entries(rawData).map(([age, height]) => ({
    age: Number(age),
    height: Number(height),
  }));

  const points = measured.map((d) => ({ x: d.age, y: d.height }));
  const { slope, intercept } = linearRegression(points);

  const forecastAge = 18;
  const forecastHeight = +(slope * forecastAge + intercept).toFixed(1);

  // Build chart data: measured + forecast points up to age 18
  const lastMeasuredAge = Math.max(...measured.map((d) => d.age));
  const forecastPoints: { age: number; forecast: number }[] = [];
  for (let a = lastMeasuredAge; a <= forecastAge; a++) {
    forecastPoints.push({ age: a, forecast: +(slope * a + intercept).toFixed(1) });
  }

  // Merge into a single series for the chart
  const chartData: { age: number; height?: number; forecast?: number }[] = [];
  for (let a = 0; a <= forecastAge; a++) {
    const measured_ = measured.find((d) => d.age === a);
    const forecast_ = forecastPoints.find((d) => d.age === a);
    chartData.push({
      age: a,
      height: measured_?.height,
      forecast: forecast_?.forecast,
    });
  }

  return (
    <div>
      <p style={{ margin: "0 0 8px" }}>
        📏 Forecast height at age {forecastAge}:{" "}
        <strong>{forecastHeight} cm</strong>
        <span style={{ color: "#888", fontSize: 13 }}>
          {" "}
          (linear regression over all measured data)
        </span>
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="age" label={{ value: "Age", position: "insideBottom", offset: 0 }} />
          <YAxis unit=" cm" domain={[40, 200]} />
          <Tooltip formatter={(v) => (v != null ? `${v} cm` : "")} />
          <Legend verticalAlign="top" />
          <ReferenceLine
            x={forecastAge}
            stroke="#e74c3c"
            strokeDasharray="4 4"
            label={{ value: `Age ${forecastAge}`, position: "insideTopRight", fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="height"
            name="Measured height"
            stroke="#2980b9"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast (linear)"
            stroke="#e74c3c"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Main App ── */

function App() {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
      }}
    >
      <h1 style={{ color: "#333" }}>Henning's Family Dashboard</h1>

      {/* 1. Family tree */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>1. Family Tree</h2>
        <p style={{ color: "#555", fontSize: 13, marginTop: 0 }}>
          Click <strong>+/−</strong> to expand or collapse branches. Blue =
          male, pink = female.
        </p>
        <FamilyNode person={henning} />
      </section>

      {/* 2. Age bar chart */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>2. Ages of the Family</h2>
        <AgeBarChart root={henning} />
      </section>

      {/* 3. Average shoe size per gender */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>3. Average Shoe Size per Gender</h2>
        <AvgShoeSize root={henning} />
      </section>

      {/* 4. Lars growth + forecast */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>4. Lars – Height Growth &amp; Forecast</h2>
        <LarsGrowthChart person={lars} />
      </section>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: "20px 24px",
  marginBottom: 24,
  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
};

const h2Style: React.CSSProperties = {
  marginTop: 0,
  color: "#2c3e50",
  borderBottom: "2px solid #eee",
  paddingBottom: 8,
};

export default App;
