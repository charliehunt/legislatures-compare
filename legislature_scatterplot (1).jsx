import { useState, useMemo, useRef, useCallback } from "react";
import {
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

const RAW_DATA = [
  { country: "Iceland", population: 391180, seats: 63 },
  { country: "Ireland", population: 4937786, seats: 174 },
  { country: "Israel", population: 7821850, seats: 120 },
  { country: "Switzerland", population: 8061516, seats: 200 },
  { country: "Sweden", population: 9723809, seats: 349 },
  { country: "Greece", population: 10775557, seats: 300 },
  { country: "Australia", population: 27286253, seats: 150 },
  { country: "Canada", population: 36991981, seats: 343 },
  { country: "Poland", population: 38346279, seats: 460 },
  { country: "South Korea", population: 49039986, seats: 300 },
  { country: "Colombia", population: 49336454, seats: 166 },
  { country: "Italy", population: 59030133, seats: 400 },
  { country: "United Kingdom", population: 68350000, seats: 650 },
  { country: "France", population: 68400000, seats: 577 },
  { country: "Germany", population: 84482267, seats: 630 },
  { country: "Japan", population: 124516650, seats: 465 },
  { country: "Mexico", population: 128455567, seats: 500 },
  { country: "United States", population: 318892103, seats: 435 },
];

function generateCubeRootCurve(maxPop) {
  const points = [];
  const steps = 300;
  for (let i = 0; i <= steps; i++) {
    const pop = (maxPop * i) / steps;
    points.push({ population: pop, cubeRoot: Math.pow(pop, 1 / 3) });
  }
  return points;
}

const formatPop = (v) => {
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return `${v}`;
};

const LABEL_OFFSETS = {
  "Iceland":        { dx: 8,   dy: 5,   anchor: "start" },
  "Ireland":        { dx: 8,   dy: 5,   anchor: "start" },
  "Israel":         { dx: 8,   dy: 5,   anchor: "start" },
  "Switzerland":    { dx: 8,   dy: 5,   anchor: "start" },
  "Sweden":         { dx: 8,   dy: 5,   anchor: "start" },
  "Greece":         { dx: 8,   dy: 5,   anchor: "start" },
  "Australia":      { dx: 8,   dy: 5,   anchor: "start" },
  "Canada":         { dx: 8,   dy: 5,   anchor: "start" },
  "Poland":         { dx: 8,   dy: 5,   anchor: "start" },
  "South Korea":    { dx: 8,   dy: 5,   anchor: "start" },
  "Colombia":       { dx: 8,   dy: 5,   anchor: "start" },
  "Italy":          { dx: 8,   dy: 5,   anchor: "start" },
  "United Kingdom": { dx: 0,   dy: -14, anchor: "middle" },
  "France":         { dx: 8,   dy: 14,  anchor: "start" },
  "Germany":        { dx: 8,   dy: 5,   anchor: "start" },
  "Japan":          { dx: -8,  dy: 5,   anchor: "end" },
  "Mexico":         { dx: 8,   dy: 5,   anchor: "start" },
  "United States":  { dx: -8,  dy: 5,   anchor: "end" },
};

const X_TICKS = [0, 100e6, 200e6, 300e6];
const Y_TICKS = [0, 100, 200, 300, 400, 500, 600, 700];

export default function LegislatureScatterplot() {
  const [selected, setSelected] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);
  const dotPositions = useRef({});

  const maxPop = useMemo(
    () => Math.max(...RAW_DATA.map((d) => d.population)) * 1.08,
    []
  );
  const curveLine = useMemo(() => generateCubeRootCurve(maxPop), [maxPop]);

  const handleDotClick = useCallback((country, cx, cy) => {
    if (selected === country) {
      setSelected(null);
    } else {
      setSelected(country);
      setTooltipPos({ x: cx, y: cy });
    }
  }, [selected]);

  // Click on empty chart area dismisses the tooltip
  const handleContainerClick = useCallback((e) => {
    // Check if click is near any dot
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const positions = dotPositions.current;
    const countries = Object.keys(positions);
    for (let i = 0; i < countries.length; i++) {
      const p = positions[countries[i]];
      const dist = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
      if (dist <= 16) return; // Click was on a dot, let dot handler manage it
    }
    setSelected(null);
  }, []);

  const CustomScatterDot = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return null;
    const offsets = LABEL_OFFSETS[payload.country] || { dx: 8, dy: 5, anchor: "start" };
    const isSelected = selected === payload.country;

    dotPositions.current[payload.country] = { x: cx, y: cy };

    return (
      <g>
        {/* Invisible hit area for easier clicking */}
        <circle
          cx={cx}
          cy={cy}
          r={14}
          fill="transparent"
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            handleDotClick(payload.country, cx, cy);
          }}
        />
        {/* Visible dot */}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 7 : 5}
          fill={isSelected ? "#059669" : "#34d399"}
          stroke="#065f46"
          strokeWidth={1.5}
          style={{ pointerEvents: "none" }}
        />
        {/* Label */}
        <text
          x={cx + offsets.dx}
          y={cy + offsets.dy}
          textAnchor={offsets.anchor}
          fill="#475569"
          fontSize={11}
          fontFamily="'Source Sans 3', sans-serif"
          fontWeight={isSelected ? 700 : 500}
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            handleDotClick(payload.country, cx, cy);
          }}
        >
          {payload.country}
        </text>
      </g>
    );
  };

  const selectedData = selected
    ? RAW_DATA.find((d) => d.country === selected)
    : null;

  // Position tooltip above or below the dot depending on vertical space
  const tooltipAbove = tooltipPos.y > 120;
  const tooltipLeft = tooltipPos.x > 500;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 40%, #e8eef6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Source Sans 3', sans-serif",
        boxSizing: "border-box",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap"
        rel="stylesheet"
      />

      <div style={{ width: "100%", maxWidth: 960 }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#1e293b",
            fontSize: 26,
            fontWeight: 700,
            margin: "0 0 6px 0",
            letterSpacing: "-0.01em",
          }}
        >
          Lower House Size vs. Population
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: 14,
            margin: "0 0 28px 0",
            lineHeight: 1.5,
          }}
        >
          Each dot is a country's lower legislative chamber. The{" "}
          <span style={{ color: "#d97706", fontWeight: 600 }}>cube root curve</span>{" "}
          shows ∛(population) — a common benchmark for legislature sizing.
          {" "}Click or tap on each country to see more info, including the country's
          ideal legislature size according to the cube root curve.
        </p>

        <div
          ref={chartRef}
          onClick={handleContainerClick}
          style={{
            position: "relative",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "24px 12px 12px 0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          <ResponsiveContainer width="100%" height={520}>
            <ComposedChart margin={{ top: 20, right: 40, bottom: 50, left: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,0,0,0.06)"
              />
              <XAxis
                dataKey="population"
                type="number"
                domain={[0, 350e6]}
                ticks={X_TICKS}
                tickFormatter={formatPop}
                tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "'Source Sans 3', sans-serif" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
                label={{
                  value: "National Population",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#64748b",
                  fontSize: 13,
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontWeight: 600,
                }}
              />
              <YAxis
                dataKey="seats"
                type="number"
                domain={[0, 700]}
                ticks={Y_TICKS}
                tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "'Source Sans 3', sans-serif" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
                label={{
                  value: "Seats in Lower House",
                  angle: -90,
                  position: "insideLeft",
                  offset: 4,
                  fill: "#64748b",
                  fontSize: 13,
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontWeight: 600,
                }}
              />
              <Line
                data={curveLine}
                dataKey="cubeRoot"
                type="monotone"
                dot={false}
                stroke="#d97706"
                strokeWidth={2}
                strokeOpacity={0.4}
                strokeDasharray="6 3"
                name="Cube root"
                legendType="none"
                tooltipType="none"
              />
              <Scatter
                data={RAW_DATA}
                dataKey="seats"
                shape={<CustomScatterDot />}
                name="Countries"
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {selectedData && (
            <div
              style={{
                position: "absolute",
                left: tooltipLeft ? tooltipPos.x - 12 : tooltipPos.x + 12,
                top: tooltipAbove ? tooltipPos.y - 110 : tooltipPos.y + 20,
                transform: tooltipLeft ? "translateX(-100%)" : "none",
                background: "rgba(255, 255, 255, 0.97)",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "10px 14px",
                fontFamily: "'Source Sans 3', sans-serif",
                color: "#334155",
                fontSize: 13,
                lineHeight: 1.5,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                pointerEvents: "none",
                zIndex: 50,
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#1e293b" }}>
                {selectedData.country}
              </div>
              <div>
                Population: <strong>{selectedData.population.toLocaleString()}</strong>
              </div>
              <div>
                Seats: <strong>{selectedData.seats}</strong>
              </div>
              <div>
                Ideal Legislature Size: <strong>{Math.round(Math.pow(selectedData.population, 1 / 3))}</strong>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 16,
            justifyContent: "center",
            fontSize: 12,
            color: "#64748b",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#34d399",
                display: "inline-block",
                border: "1.5px solid #065f46",
              }}
            />
            Country
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 20,
                height: 0,
                borderTop: "2px dashed #d97706",
                opacity: 0.5,
                display: "inline-block",
              }}
            />
            ∛(population)
          </span>
        </div>
      </div>
    </div>
  );
}
