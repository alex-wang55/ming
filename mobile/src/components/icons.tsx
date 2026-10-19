import Svg, { Circle, Path, Rect } from "react-native-svg";

// The same line icons the web app draws inline, as react-native-svg components.
type P = { size?: number; color: string; strokeWidth?: number };

const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const });
const line = (color: string, w: number) => ({ stroke: color, strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export const CheckIcon = ({ size = 15, color, strokeWidth = 2.2 }: P) => (
  <Svg {...base(size)}>
    <Path d="M20 6 9 17l-5-5" {...line(color, strokeWidth)} />
  </Svg>
);

export const LockIcon = ({ size = 15, color, strokeWidth = 2 }: P) => (
  <Svg {...base(size)}>
    <Rect x="3" y="11" width="18" height="11" rx="2" {...line(color, strokeWidth)} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" {...line(color, strokeWidth)} />
  </Svg>
);

export const DotIcon = ({ size = 15, color }: P) => (
  <Svg {...base(size)}>
    <Circle cx="12" cy="12" r="4" fill={color} />
  </Svg>
);

export const ChevronIcon = ({ size = 12, color, strokeWidth = 2.5 }: P) => (
  <Svg {...base(size)}>
    <Path d="m9 18 6-6-6-6" {...line(color, strokeWidth)} />
  </Svg>
);

export const SpeakerIcon = ({ size = 13, color, strokeWidth = 2 }: P) => (
  <Svg {...base(size)}>
    <Path d="M11 5 6 9H2v6h4l5 4z" {...line(color, strokeWidth)} />
    <Path d="M15.5 8.5a5 5 0 0 1 0 7" {...line(color, strokeWidth)} />
  </Svg>
);

export const MicIcon = ({ size = 18, color, strokeWidth = 2 }: P) => (
  <Svg {...base(size)}>
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" {...line(color, strokeWidth)} />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" {...line(color, strokeWidth)} />
  </Svg>
);

export const StopIcon = ({ size = 15, color }: P) => (
  <Svg {...base(size)}>
    <Rect x="5" y="5" width="14" height="14" rx="2" fill={color} />
  </Svg>
);

export const ArrowUpIcon = ({ size = 18, color, strokeWidth = 2.5 }: P) => (
  <Svg {...base(size)}>
    <Path d="M12 19V5M5 12l7-7 7 7" {...line(color, strokeWidth)} />
  </Svg>
);

export const SearchIcon = ({ size = 15, color, strokeWidth = 2 }: P) => (
  <Svg {...base(size)}>
    <Circle cx="11" cy="11" r="7" {...line(color, strokeWidth)} />
    <Path d="m21 21-4.3-4.3" {...line(color, strokeWidth)} />
  </Svg>
);

export const CloseIcon = ({ size = 18, color, strokeWidth = 2 }: P) => (
  <Svg {...base(size)}>
    <Path d="M18 6 6 18M6 6l12 12" {...line(color, strokeWidth)} />
  </Svg>
);
