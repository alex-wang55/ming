import { memo } from "react";
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import { MAP_H, MAP_W, PROVINCES } from "@/data/china-map";
import { REGIONS } from "@/shared/regions";

// The web MapTab's parchment map, drawn natively. Province shapes are bundled
// (src/data/china-map.ts) instead of fetched, so the map works offline.

const VIEW = { x0: 62, y0: 14, x1: 138, y1: 54 };
export function project(lon: number, lat: number): [number, number] {
  const x = ((lon - VIEW.x0) / (VIEW.x1 - VIEW.x0)) * MAP_W;
  const y = MAP_H - ((lat - VIEW.y0) / (VIEW.y1 - VIEW.y0)) * MAP_H;
  return [x, y];
}

const PROVINCE_CENTROIDS: Record<string, [number, number]> = {
  beijing: [116.4, 39.9],
  shanghai: [121.4, 31.2],
  chengdu: [104.1, 30.6],
  guangzhou: [113.3, 23.1],
  xian: [108.9, 34.3],
  harbin: [126.5, 45.8],
};

// Diaspora cities sit at stand-in spots on the map, same as the web version.
const DIASPORA = [
  { id: "vancouver", chineseName: "温哥华", name: "Vancouver", lon: 65, lat: 48, labelAbove: false },
  { id: "singapore", chineseName: "新加坡", name: "Singapore", lon: 135, lat: 16, labelAbove: true },
];

const INK = "#6a4a2a";
const LINE = "#b89860";
const FILL = "#d4c8a8";
const MATCHED = "#c4a868";
const SELECTED = "#8b6a3a";
const CREAM = "#fff7ec";

// Text sizes are in map units (960 wide). On a ~390pt phone that's about 0.4x,
// so labels are drawn larger than the web's to stay readable.
function ChinaMapInner({ width, selected, onSelect }: { width: number; selected: string | null; onSelect: (id: string) => void }) {
  const height = (width * MAP_H) / MAP_W;
  const [tx, ty] = project(121.5, 24.0);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
      <Defs>
        <RadialGradient id="parchment" cx="50%" cy="50%" r="70%">
          <Stop offset="0%" stopColor="#f0e4cc" />
          <Stop offset="100%" stopColor="#e4d4b0" />
        </RadialGradient>
      </Defs>
      <Rect width={MAP_W} height={MAP_H} fill="url(#parchment)" />

      {/* Subtle grid lines like old maps */}
      {Array.from({ length: 8 }, (_, i) => (
        <Line key={`h${i}`} x1={0} y1={i * (MAP_H / 7)} x2={MAP_W} y2={i * (MAP_H / 7)} stroke="#c4b088" strokeWidth={0.8} opacity={0.4} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <Line key={`v${i}`} x1={i * (MAP_W / 11)} y1={0} x2={i * (MAP_W / 11)} y2={MAP_H} stroke="#c4b088" strokeWidth={0.8} opacity={0.4} />
      ))}

      {PROVINCES.map((p, i) => {
        const rid = p.region;
        const fill = !rid ? FILL : selected === rid ? SELECTED : MATCHED;
        return (
          <Path
            key={i}
            d={p.d}
            fill={fill}
            stroke={LINE}
            strokeWidth={rid ? 1.4 : 0.9}
            onPress={rid ? () => onSelect(rid) : undefined}
          />
        );
      })}

      {/* Taiwan */}
      <G onPress={() => onSelect("taipei")}>
        <Circle cx={tx} cy={ty} r={30} fill="transparent" />
        <Circle cx={tx} cy={ty} r={22} fill={selected === "taipei" ? SELECTED : MATCHED} stroke={LINE} strokeWidth={2} />
        <SvgText x={tx} y={ty + 7} fontSize={19} fill={selected === "taipei" ? CREAM : INK} textAnchor="middle">
          台灣
        </SvgText>
      </G>

      {/* City markers with big invisible hit areas, since provinces like Shanghai are tiny on a phone */}
      {Object.entries(PROVINCE_CENTROIDS).map(([id, [lon, lat]]) => {
        const [x, y] = project(lon, lat);
        const r = REGIONS.find((reg: { id: string }) => reg.id === id);
        if (!r) return null;
        const on = selected === id;
        return (
          <G key={id} onPress={() => onSelect(id)}>
            <Circle cx={x} cy={y} r={34} fill="transparent" />
            <Circle cx={x} cy={y} r={8} fill={on ? CREAM : "#f5ede0"} stroke={on ? SELECTED : LINE} strokeWidth={2.5} />
            <SvgText x={x} y={y - 15} fontSize={22} fontWeight="600" fill={on ? SELECTED : INK} textAnchor="middle">
              {r.chineseName}
            </SvgText>
          </G>
        );
      })}

      {DIASPORA.map((c) => {
        const [cx, cy] = project(c.lon, c.lat);
        const on = selected === c.id;
        const r = 22;
        const y1 = c.labelAbove ? cy - r - 26 : cy + r + 22;
        const y2 = c.labelAbove ? cy - r - 8 : cy + r + 40;
        return (
          <G key={c.id} onPress={() => onSelect(c.id)}>
            <Circle cx={cx} cy={cy} r={r + 10} fill="transparent" />
            <Circle cx={cx} cy={cy} r={r} fill={on ? SELECTED : "#d4b87a"} stroke={LINE} strokeWidth={2} strokeDasharray={on ? undefined : "6 4"} />
            <SvgText x={cx} y={cy + 7} fontSize={20} fill={on ? CREAM : INK} textAnchor="middle">
              ✈
            </SvgText>
            <SvgText x={cx} y={y1} fontSize={18} fill={INK} textAnchor="middle">
              {c.chineseName}
            </SvgText>
            <SvgText x={cx} y={y2} fontSize={15} fill={LINE} textAnchor="middle">
              {c.name}
            </SvgText>
          </G>
        );
      })}

      {/* Compass rose, bottom-left where the ocean is empty */}
      <G>
        <Circle cx={64} cy={516} r={34} fill="#f0e4cc" stroke="#c4b088" strokeWidth={1.5} opacity={0.9} />
        <Circle cx={64} cy={516} r={27} fill="none" stroke="#c4b088" strokeWidth={0.8} />
        <SvgText x={64} y={500} fontSize={14} fontWeight="bold" fill={SELECTED} textAnchor="middle">
          N
        </SvgText>
        <SvgText x={64} y={541} fontSize={12} fill={LINE} textAnchor="middle">
          S
        </SvgText>
        <SvgText x={82} y={520} fontSize={12} fill={LINE} textAnchor="middle">
          E
        </SvgText>
        <SvgText x={46} y={520} fontSize={12} fill={LINE} textAnchor="middle">
          W
        </SvgText>
        <Line x1={64} y1={506} x2={64} y2={526} stroke={SELECTED} strokeWidth={2} />
        <Line x1={54} y1={516} x2={74} y2={516} stroke={LINE} strokeWidth={1.5} />
      </G>
    </Svg>
  );
}

export const ChinaMap = memo(ChinaMapInner);
