import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import styles from "./PriceChart.module.css";

export default function PriceChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className={styles.empty}>
        Not enough data for a chart yet. Check back after a few more scrapes.
      </div>
    );
  }

  // Reverse so oldest is on the left
  const data = [...history].reverse().map((h) => ({
    date: new Date(h.timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    Price: h.price,
    MRP: h.mrp,
  }));

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Price History</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#2a2a38" strokeDasharray="4 4" />
          <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(v) => `₹${v.toLocaleString()}`}
            width={80}
          />
          <Tooltip
            contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a38", borderRadius: 8 }}
            labelStyle={{ color: "#f3f4f6" }}
            formatter={(value) => [`₹${value?.toLocaleString()}`, undefined]}
          />
          <Line type="monotone" dataKey="Price" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="MRP"   stroke="#4b5563" strokeWidth={1} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
