"use client";
import { useState, useEffect, useRef } from "react";
import { REGIONS, REGION_TYPES } from "@/lib/regions";

const PROVINCE_CENTROIDS = {
  beijing:      [116.4, 39.9],
  shanghai:     [121.4, 31.2],
  chengdu:      [104.1, 30.6],
  guangzhou:    [113.3, 23.1],
  xian:         [108.9, 34.3],
  harbin:       [126.5, 45.8],
  taipei:       [121.5, 25.0],
};

const DIASPORA = [
  { id: "vancouver", name: "Vancouver", chineseName: "温哥华", lon: 65, lat: 48 },
  { id: "singapore", name: "Singapore", chineseName: "新加坡", lon: 135, lat: 16 },
];

const VIEW = { x0: 62, y0: 14, x1: 138, y1: 54 };
const SVG_W = 960, SVG_H = 580;

function project(lon, lat) {
  const x = ((lon - VIEW.x0) / (VIEW.x1 - VIEW.x0)) * SVG_W;
  const y = SVG_H - ((lat - VIEW.y0) / (VIEW.y1 - VIEW.y0)) * SVG_H;
  return [x, y];
}

export default function MapTab({ onStartLesson }) {
  const [geoData, setGeoData] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/longwosion/geojson-map-china/master/china.json")
      .then(r => r.json())
      .then(data => setGeoData(data))
      .catch(() => setGeoData(null));
  }, []);

  const region = REGIONS.find(r => r.id === selected);

  function geoToPath(geometry) {
    function ringToD(ring) {
      return ring.map(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ") + " Z";
    }
    if (geometry.type === "Polygon") return geometry.coordinates.map(ringToD).join(" ");
    if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap(poly => poly.map(ringToD)).join(" ");
    return "";
  }

  function matchRegion(name) {
    const map = {
      "北京市": "beijing", "上海市": "shanghai",
      "四川省": "chengdu", "广东省": "guangzhou",
      "陕西省": "xian", "黑龙江省": "harbin",
    };
    return map[name] || null;
  }

  function getColor(rid, isMatched) {
    if (!isMatched) return hovered === rid ? "#1a2e1a" : "#141e14";
    if (selected === rid) return "#d4a843";
    if (hovered === rid) return "#5a7a2a";
    return "#2a4a1a";
  }

  function handleMouseMove(e, rid, name) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // Convert screen coords to SVG viewBox coords
    const scaleX = SVG_W / rect.width;
    const scaleY = SVG_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setTooltip({ x, y, rid, name });
    setHovered(rid || name);
}

  return (
    <div style={styles.container}>
      <div style={styles.mapWrapper}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={styles.svg}
          onMouseLeave={() => { setHovered(null); setTooltip(null); }}
        >
          <rect width={SVG_W} height={SVG_H} fill="#0a1520" />

          {[...Array(10)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 42} x2={SVG_W} y2={i * 42} stroke="#0d1f2d" strokeWidth="0.5" />
          ))}
          {[...Array(14)].map((_, i) => (
            <line key={`v${i}`} x1={i * 56} y1="0" x2={i * 56} y2={SVG_H} stroke="#0d1f2d" strokeWidth="0.5" />
          ))}

          {geoData ? geoData.features.map((f, i) => {
            const name = f.properties?.name || "";
            const rid = matchRegion(name);
            const isMatched = !!rid;
            const pathD = geoToPath(f.geometry);
            if (!pathD) return null;
            return (
              <path
                key={i}
                d={pathD}
                fill={getColor(rid, isMatched)}
                stroke="#1e3a1e"
                strokeWidth="0.7"
                style={{ cursor: isMatched ? "pointer" : "default", transition: "fill 0.15s" }}
                onMouseMove={e => handleMouseMove(e, rid, name)}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                onClick={() => isMatched && setSelected(rid)}
              />
            );
          }) : (
            <text x={SVG_W / 2} y={SVG_H / 2} fill="#3a5a3a" textAnchor="middle" fontSize="14">Loading map...</text>
          )}

          {/* Taiwan */}
          {(() => {
            const [tx, ty] = project(121.5, 24.0);
            return (
              <g style={{ cursor: "pointer" }}
                onClick={() => setSelected("taipei")}
                onMouseMove={e => handleMouseMove(e, "taipei", "台灣")}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              >
                <circle cx={tx} cy={ty} r="12"
                  fill={selected === "taipei" ? "#68d391" : hovered === "taipei" ? "#2a5a3a" : "#1a3a2a"}
                  stroke="#68d391" strokeWidth="1.5" />
                <text x={tx} y={ty + 4} fontSize="8" fill={selected === "taipei" ? "#0f0f0f" : "#68d391"} textAnchor="middle" style={{ pointerEvents: "none" }}>台灣</text>
              </g>
            );
          })()}

          {/* Province markers */}
          {Object.entries(PROVINCE_CENTROIDS).filter(([id]) => id !== "taipei").map(([id, [lon, lat]]) => {
            const [x, y] = project(lon, lat);
            const r = REGIONS.find(r => r.id === id);
            if (!r) return null;
            return (
              <g key={id} style={{ pointerEvents: "none" }}>
                <circle cx={x} cy={y} r="5" fill={selected === id ? "#d4a843" : "#2a5a1a"} stroke={selected === id ? "#d4a843" : "#4a8a2a"} strokeWidth="1" />
                <text x={x} y={y - 8} fontSize="8" fill={selected === id ? "#d4a843" : "#8aba5a"} textAnchor="middle">{r.chineseName}</text>
              </g>
            );
          })}

          {/* Diaspora cities */}
          {DIASPORA.map(c => {
            const [cx, cy] = project(c.lon, c.lat);
            return (
              <g key={c.id} style={{ cursor: "pointer" }}
                onClick={() => setSelected(c.id)}
                onMouseMove={e => handleMouseMove(e, c.id, c.name)}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              >
                <circle cx={cx} cy={cy} r="10"
                  fill={selected === c.id ? "#76e4f7" : hovered === c.id ? "#1a4a5a" : "#0d2a3a"}
                  stroke="#76e4f7" strokeWidth="1.5"
                  strokeDasharray={selected === c.id ? "none" : "3 2"} />
                <text x={cx} y={cy + 4} fontSize="9" fill={selected === c.id ? "#0f0f0f" : "#76e4f7"} textAnchor="middle" style={{ pointerEvents: "none" }}>✈</text>
                <text x={cx} y={cy + 20} fontSize="8" fill="#76e4f7" textAnchor="middle" style={{ pointerEvents: "none" }}>{c.name}</text>
                <text x={cx} y={cy + 30} fontSize="7" fill="#4a8a9a" textAnchor="middle" style={{ pointerEvents: "none" }}>{c.chineseName}</text>
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip && tooltip.rid && (() => {
            const r = REGIONS.find(r => r.id === tooltip.rid);
            if (!r) return null;
            const tw = 180, th = 52;
            let tx = tooltip.x + 16;
            let ty = tooltip.y - 60;
            if (tx + tw > SVG_W - 10) tx = tooltip.x - tw - 16;
            if (tx < 10) tx = 10;
            if (ty < 10) ty = tooltip.y + 16;
            if (ty + th > SVG_H - 10) ty = tooltip.y - th - 8;
            return (
                <g style={{ pointerEvents: "none" }}>
                <rect x={tx} y={ty} width={tw} height={th} rx="7" fill="#0d1a0d" stroke="#3a5a2a" strokeWidth="1" />
                <text x={tx + 12} y={ty + 18} fontSize="13" fontWeight="500" fill="#d4a843">{r.chineseName} {r.name}</text>
                <text x={tx + 12} y={ty + 32} fontSize="10" fill="#888">{REGION_TYPES[r.type].label}</text>
                <text x={tx + 12} y={ty + 44} fontSize="10" fill="#5a8a5a">Click to explore →</text>
                </g>
            );
            })()}

          {/* Legend */}
          <g transform={`translate(12, ${SVG_H - 90})`}>
            <rect width="138" height="84" rx="6" fill="#0a1520" stroke="#1e2a3a" strokeWidth="0.8" fillOpacity="0.92" />
            <text x="10" y="16" fontSize="8" fill="#4a6a8a" fontWeight="500">LEGEND</text>
            <circle cx="18" cy="30" r="5" fill="#2a4a1a" stroke="#4a8a2a" strokeWidth="1" />
            <text x="28" y="34" fontSize="8" fill="#888">Clickable region</text>
            <circle cx="18" cy="46" r="5" fill="#d4a843" />
            <text x="28" y="50" fontSize="8" fill="#888">Selected</text>
            <circle cx="18" cy="62" r="5" fill="#1a3a2a" stroke="#68d391" strokeWidth="1.5" />
            <text x="28" y="66" fontSize="8" fill="#888">Taiwan</text>
            <circle cx="18" cy="78" r="5" fill="#0d2a3a" stroke="#76e4f7" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x="28" y="82" fontSize="8" fill="#888">Diaspora city</text>
          </g>
        </svg>
      </div>

      {/* Detail panel */}
      <div style={styles.detail}>
        {!region ? (
          <div style={styles.placeholder}>
            <p style={styles.placeholderIcon}>🗺️</p>
            <p style={styles.placeholderTitle}>Click a region</p>
            <p style={styles.placeholderText}>Select a highlighted province, Taiwan, or a diaspora city to explore its accent, culture, and food</p>
          </div>
        ) : (
          <div>
            <div style={styles.detailHeader}>
              <div>
                <h2 style={styles.detailChinese}>{region.chineseName}</h2>
                <h3 style={styles.detailName}>{region.name}</h3>
                <span style={{ ...styles.typeBadge, background: `${REGION_TYPES[region.type].color}20`, color: REGION_TYPES[region.type].color }}>
                  {REGION_TYPES[region.type].label}
                </span>
              </div>
              <button style={styles.startBtn} onClick={() => onStartLesson(region)}>
                Start lesson here →
              </button>
            </div>
            <Section title="🗣️ Accent & Speech"><p style={styles.detailText}>{region.accent}</p></Section>
            <Section title="🏮 Culture"><p style={styles.detailText}>{region.culture}</p></Section>
            <Section title="💡 Local tip"><p style={styles.detailText}>{region.tip}</p></Section>
            <Section title="🍜 Food vocabulary">
              {region.food.map((f, i) => <p key={i} style={{ ...styles.detailText, marginBottom: "4px" }}>• {f}</p>)}
            </Section>
            <Section title="🎭 Scenarios">
              <div style={styles.scenarioList}>
                {region.scenarios.map((s, i) => <span key={i} style={styles.scenarioPill}>{s}</span>)}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <p style={styles.sectionTitle}>{title}</p>
      {children}
    </div>
  );
}

const styles = {
  container: { display: "flex", height: "100%", overflow: "hidden" },
  mapWrapper: { flex: "0 0 65%", background: "#0a1520", display: "flex", alignItems: "center", justifyContent: "center", padding: "0", borderRight: "1px solid #1e2a3a" },
  svg: { width: "100%", height: "calc(100vh - 52px)", display: "block" },
  detail: { flex: 1, overflowY: "auto", padding: "20px", background: "#0f0f0f" },
  placeholder: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", textAlign: "center", padding: "24px" },
  placeholderIcon: { fontSize: "40px", margin: 0 },
  placeholderTitle: { fontSize: "16px", fontWeight: 500, color: "#f0f0f0", margin: 0 },
  placeholderText: { fontSize: "13px", color: "#555", maxWidth: "220px", lineHeight: 1.6, margin: 0 },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "12px" },
  detailChinese: { fontSize: "26px", fontFamily: "'Noto Sans SC', sans-serif", color: "#d4a843", margin: "0 0 2px" },
  detailName: { fontSize: "18px", color: "#f0f0f0", fontWeight: 500, margin: "0 0 6px" },
  typeBadge: { fontSize: "11px", padding: "2px 10px", borderRadius: "20px", fontWeight: 500 },
  startBtn: { padding: "9px 14px", borderRadius: "10px", background: "#d4a843", border: "none", color: "#0f0f0f", fontSize: "13px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  section: { marginBottom: "10px", padding: "12px 14px", background: "#1a1a1a", borderRadius: "10px", border: "1px solid #2a2a2a" },
  sectionTitle: { fontSize: "12px", fontWeight: 500, color: "#f0f0f0", margin: "0 0 6px" },
  detailText: { fontSize: "12px", color: "#aaa", lineHeight: "1.6", margin: 0 },
  scenarioList: { display: "flex", flexWrap: "wrap", gap: "5px" },
  scenarioPill: { fontSize: "11px", padding: "3px 9px", borderRadius: "20px", background: "#2a2a2a", color: "#aaa" },
};