"use client";
import { useState, useEffect, useRef } from "react";
import { REGIONS, REGION_TYPES } from "@/lib/regions";

const PROVINCE_CENTROIDS = {
  beijing:   [116.4, 39.9],
  shanghai:  [121.4, 31.2],
  chengdu:   [104.1, 30.6],
  guangzhou: [113.3, 23.1],
  xian:      [108.9, 34.3],
  harbin:    [126.5, 45.8],
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

function matchRegion(name) {
  const map = {
    "北京市": "beijing", "上海市": "shanghai",
    "四川省": "chengdu", "广东省": "guangzhou",
    "陕西省": "xian", "黑龙江省": "harbin",
  };
  return map[name] || null;
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
      .then(setGeoData)
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
    if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap(p => p.map(ringToD)).join(" ");
    return "";
  }

  function getProvinceColor(rid, isMatched) {
    if (!isMatched) {
      return hovered === rid ? "#c8b898" : "#d4c8a8";
    }
    if (selected === rid) return "#8b6a3a";
    if (hovered === rid) return "#b8924a";
    return "#c4a868";
  }

  function handleMouseMove(e, rid, name) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const scaleY = SVG_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setTooltip({ x, y, rid, name });
    setHovered(rid || name);
  }

  return (
    <div style={styles.container}>
      {/* Map */}
      <div style={styles.mapWrapper}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={styles.svg}
          onMouseLeave={() => { setHovered(null); setTooltip(null); }}
        >
          {/* Parchment background */}
          <defs>
            <radialGradient id="parchment" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#f0e4cc" />
              <stop offset="100%" stopColor="#e4d4b0" />
            </radialGradient>
            <filter id="papernoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feBlend in="SourceGraphic" mode="multiply" />
            </filter>
          </defs>

          <rect width={SVG_W} height={SVG_H} fill="url(#parchment)" />
          <rect width={SVG_W} height={SVG_H} fill="#c8a860" opacity="0.04" filter="url(#papernoise)" />

          {/* Subtle grid lines like old maps */}
          {[...Array(8)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * (SVG_H / 7)} x2={SVG_W} y2={i * (SVG_H / 7)} stroke="#c4b088" strokeWidth="0.4" opacity="0.4" />
          ))}
          {[...Array(12)].map((_, i) => (
            <line key={`v${i}`} x1={i * (SVG_W / 11)} y1="0" x2={i * (SVG_W / 11)} y2={SVG_H} stroke="#c4b088" strokeWidth="0.4" opacity="0.4" />
          ))}

          {/* Province paths */}
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
                fill={getProvinceColor(rid, isMatched)}
                stroke="#b89860"
                strokeWidth={isMatched ? "1.2" : "0.8"}
                style={{ cursor: isMatched ? "pointer" : "default", transition: "fill 0.2s" }}
                onMouseMove={e => handleMouseMove(e, rid, name)}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                onClick={() => isMatched && setSelected(rid)}
              />
            );
          }) : (
            <text x={SVG_W / 2} y={SVG_H / 2} fill="#b89860" textAnchor="middle" fontSize="18" fontFamily="Georgia, serif">
              Loading map...
            </text>
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
                <circle cx={tx} cy={ty} r="14"
                  fill={selected === "taipei" ? "#8b6a3a" : hovered === "taipei" ? "#b8924a" : "#c4a868"}
                  stroke="#b89860" strokeWidth="1.5" />
                <text x={tx} y={ty + 4} fontSize="9" fill={selected === "taipei" ? "#fff7ec" : "#6a4a2a"} textAnchor="middle" fontFamily="'Noto Sans SC', sans-serif" style={{ pointerEvents: "none" }}>台灣</text>
              </g>
            );
          })()}

          {/* Province name labels */}
          {Object.entries(PROVINCE_CENTROIDS).map(([id, [lon, lat]]) => {
            const [x, y] = project(lon, lat);
            const r = REGIONS.find(r => r.id === id);
            if (!r) return null;
            return (
              <g key={id} style={{ pointerEvents: "none" }}>
                <circle cx={x} cy={y} r="5"
                  fill={selected === id ? "#fff7ec" : "#f5ede0"}
                  stroke={selected === id ? "#8b6a3a" : "#b89860"}
                  strokeWidth="1.5" />
                <text x={x} y={y - 9} fontSize="9" fill={selected === id ? "#8b6a3a" : "#6a4a2a"}
                  textAnchor="middle" fontFamily="'Noto Sans SC', sans-serif" fontWeight="500">
                  {r.chineseName}
                </text>
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
                <circle cx={cx} cy={cy} r="12"
                  fill={selected === c.id ? "#8b6a3a" : hovered === c.id ? "#b8924a" : "#d4b87a"}
                  stroke="#b89860" strokeWidth="1.5"
                  strokeDasharray={selected === c.id ? "none" : "4 2"} />
                <text x={cx} y={cy + 4} fontSize="10" fill={selected === c.id ? "#fff7ec" : "#6a4a2a"} textAnchor="middle" style={{ pointerEvents: "none" }}>✈</text>
                <text x={cx} y={cy + 22} fontSize="8" fill="#6a4a2a" textAnchor="middle" fontFamily="'Noto Sans SC', sans-serif" style={{ pointerEvents: "none" }}>{c.chineseName}</text>
                <text x={cx} y={cy + 32} fontSize="7" fill="#b89860" textAnchor="middle" style={{ pointerEvents: "none" }}>{c.name}</text>
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip && tooltip.rid && (() => {
            const r = REGIONS.find(r => r.id === tooltip.rid);
            if (!r) return null;
            const tw = 160, th = 48;
            let tx = tooltip.x + 16;
            let ty = tooltip.y - 56;
            if (tx + tw > SVG_W - 10) tx = tooltip.x - tw - 16;
            if (tx < 10) tx = 10;
            if (ty < 10) ty = tooltip.y + 16;
            if (ty + th > SVG_H - 10) ty = tooltip.y - th - 8;
            return (
              <g style={{ pointerEvents: "none" }}>
                <rect x={tx} y={ty} width={tw} height={th} rx="6" fill="#fff7ec" stroke="#e8d4a8" strokeWidth="1" />
                <text x={tx + 10} y={ty + 16} fontSize="13" fontWeight="500" fill="#8b6a3a" fontFamily="'Noto Sans SC', sans-serif">{r.chineseName}</text>
                <text x={tx + 10} y={ty + 28} fontSize="10" fill="#b89060">{r.name} · {REGION_TYPES[r.type].label}</text>
                <text x={tx + 10} y={ty + 40} fontSize="10" fill="#c4903a">Click to explore →</text>
              </g>
            );
          })()}

          {/* Compass rose */}
          {(() => {
            const cx = SVG_W - 60, cy = SVG_H - 60;
            return (
              <g style={{ pointerEvents: "none" }}>
                <circle cx={cx} cy={cy} r="28" fill="#f0e4cc" stroke="#c4b088" strokeWidth="1" opacity="0.9" />
                <circle cx={cx} cy={cy} r="22" fill="none" stroke="#c4b088" strokeWidth="0.5" />
                <text x={cx} y={cy - 12} fontSize="11" textAnchor="middle" fill="#8b6a3a" fontFamily="Georgia, serif" fontWeight="bold">N</text>
                <text x={cx} y={cy + 18} fontSize="9" textAnchor="middle" fill="#b89860" fontFamily="Georgia, serif">S</text>
                <text x={cx + 14} y={cy + 4} fontSize="9" textAnchor="middle" fill="#b89860" fontFamily="Georgia, serif">E</text>
                <text x={cx - 14} y={cy + 4} fontSize="9" textAnchor="middle" fill="#b89860" fontFamily="Georgia, serif">W</text>
                <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} stroke="#8b6a3a" strokeWidth="1.5" />
                <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke="#b89860" strokeWidth="1" />
              </g>
            );
          })()}

          {/* Legend */}
          <g transform={`translate(12, ${SVG_H - 105})`}>
            <rect width="130" height="98" rx="6" fill="#fff7ec" stroke="#e8d4a8" strokeWidth="0.8" fillOpacity="0.95" />
            <text x="10" y="16" fontSize="9" fill="#b89060" fontWeight="600" fontFamily="Georgia, serif" letterSpacing="0.05em">LEGEND</text>
            <circle cx="18" cy="30" r="5" fill="#c4a868" stroke="#b89860" strokeWidth="1" />
            <text x="28" y="34" fontSize="8" fill="#6a5840">Clickable region</text>
            <circle cx="18" cy="46" r="5" fill="#8b6a3a" />
            <text x="28" y="50" fontSize="8" fill="#6a5840">Selected</text>
            <circle cx="18" cy="62" r="5" fill="#c4a868" stroke="#b89860" strokeWidth="1.5" />
            <text x="28" y="66" fontSize="8" fill="#6a5840">Taiwan</text>
            <circle cx="18" cy="78" r="5" fill="#d4b87a" stroke="#b89860" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x="28" y="82" fontSize="8" fill="#6a5840">Diaspora city</text>
            <text x="10" y="94" fontSize="7" fill="#b89060" fontStyle="italic">Hover to preview · click to explore</text>
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
              <span style={{ ...styles.typeBadge, background: region.type === "mainland" ? "#fff7ec" : region.type === "taiwan" ? "#eef5e8" : "#f0f5ff", color: region.type === "mainland" ? "#8b6a3a" : region.type === "taiwan" ? "#4a7a3a" : "#4a6abf", border: `1px solid ${region.type === "mainland" ? "#e8d4a8" : region.type === "taiwan" ? "#c8dab8" : "#c8d8f8"}` }}>
                {REGION_TYPES[region.type].label}
              </span>
            </div>
            <h2 style={styles.detailChinese}>{region.chineseName}</h2>
            <h3 style={styles.detailName}>{region.name}</h3>

            <Section title="🗣️ Accent & Speech">
              <p style={styles.detailText}>{region.accent}</p>
            </Section>
            <Section title="🏮 Culture">
              <p style={styles.detailText}>{region.culture}</p>
            </Section>
            <Section title="💡 Local tip">
              <p style={styles.detailText}>{region.tip}</p>
            </Section>
            <Section title="🍜 Food vocabulary">
              {region.food.map((f, i) => <p key={i} style={{ ...styles.detailText, marginBottom: "4px" }}>• {f}</p>)}
            </Section>
            <Section title="🎭 Scenarios">
              <div style={styles.scenarioList}>
                {region.scenarios.map((s, i) => <span key={i} style={styles.scenarioPill}>{s}</span>)}
              </div>
            </Section>

            <button style={styles.startBtn} onClick={() => onStartLesson(region)}>
              Start lesson in {region.name} →
            </button>
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
  mapWrapper: { flex: "0 0 63%", background: "#e8d8b8", display: "flex", alignItems: "center", justifyContent: "center", padding: "0", borderRight: "1px solid #e0d0b0" },
  svg: { width: "100%", height: "calc(100vh - 52px)", display: "block" },
  detail: { flex: 1, overflowY: "auto", padding: "20px", background: "#faf8f4" },
  placeholder: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", textAlign: "center", padding: "24px" },
  placeholderIcon: { fontSize: "40px", margin: 0 },
  placeholderTitle: { fontSize: "16px", fontWeight: 500, color: "#2d2520", margin: 0 },
  placeholderText: { fontSize: "13px", color: "#aaa", maxWidth: "220px", lineHeight: 1.6, margin: 0 },
  detailHeader: { marginBottom: "8px" },
  typeBadge: { fontSize: "11px", padding: "3px 10px", borderRadius: "20px", fontWeight: 500 },
  detailChinese: { fontSize: "32px", fontFamily: "'Noto Sans SC', sans-serif", color: "#8b6a3a", margin: "8px 0 2px", fontWeight: 500, lineHeight: 1 },
  detailName: { fontSize: "18px", color: "#2d2520", fontWeight: 500, margin: "0 0 14px", fontFamily: "Georgia, serif" },
  section: { marginBottom: "10px", padding: "12px 14px", background: "#ffffff", borderRadius: "10px", border: "1px solid #e8e0d4" },
  sectionTitle: { fontSize: "12px", fontWeight: 600, color: "#6a5040", margin: "0 0 6px" },
  detailText: { fontSize: "13px", color: "#6a5840", lineHeight: "1.6", margin: 0 },
  scenarioList: { display: "flex", flexWrap: "wrap", gap: "5px" },
  scenarioPill: { fontSize: "11px", padding: "3px 9px", borderRadius: "20px", background: "#fff7ec", border: "1px solid #e8d4a8", color: "#8b6a3a" },
  startBtn: { width: "100%", marginTop: "14px", padding: "12px", borderRadius: "10px", background: "#8b6a3a", border: "none", color: "#fff7ec", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "Georgia, serif" },
};