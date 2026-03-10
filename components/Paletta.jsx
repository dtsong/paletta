import { useState, useRef, useCallback } from "react";

const TAU = Math.PI * 2;
const WHEEL_COLORS = 24;

function hslStr(h, s = 70, l = 55) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function normHue(h) {
  return ((h % 360) + 360) % 360;
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/* ── Toast notification ── */
function Toast({ message, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0, transition: "all 0.25s ease",
      background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
      padding: "10px 20px", color: "#e8e6e1", fontSize: 13,
      fontFamily: "'Courier New', monospace", letterSpacing: 0.5,
      pointerEvents: "none", zIndex: 999,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      {message}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState({ message: "", visible: false });
  const timerRef = useRef(null);
  const show = useCallback((msg) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message: msg, visible: true });
    timerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1800);
  }, []);
  return [toast, show];
}

/* ── Copyable swatch ── */
function CopyableSwatch({ hue, sat, lit, size = 44 }) {
  const hex = hslToHex(hue, sat, lit);
  const [toast, showToast] = useToast();
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <div
        onClick={() => { navigator.clipboard.writeText(hex); showToast(`Copied ${hex}`); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: size, height: size, borderRadius: 8,
          background: hslStr(hue, sat, lit),
          border: "2px solid rgba(255,255,255,0.15)",
          boxShadow: hovered ? "0 0 0 2px rgba(255,255,255,0.4)" : "0 2px 8px rgba(0,0,0,0.25)",
          cursor: "pointer", position: "relative", transition: "box-shadow 0.15s",
        }}
        title={`Click to copy ${hex}`}
      >
        {hovered && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.45)", borderRadius: 6, fontSize: 9,
            color: "#fff", fontFamily: "'Courier New', monospace", letterSpacing: 0.5,
          }}>
            {hex}
          </div>
        )}
      </div>
      <Toast {...toast} />
    </>
  );
}

/* ── Color wheel ── */
function ColorWheel({ hue, highlights, connections, size = 160 }) {
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR - 22;
  const dotR = (outerR + innerR) / 2;
  const segments = [];
  for (let i = 0; i < WHEEL_COLORS; i++) {
    const startAngle = (i / WHEEL_COLORS) * TAU - Math.PI / 2;
    const endAngle = ((i + 1) / WHEEL_COLORS) * TAU - Math.PI / 2;
    const segHue = (i / WHEEL_COLORS) * 360;
    const x1 = cx + outerR * Math.cos(startAngle), y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle), y2 = cy + outerR * Math.sin(endAngle);
    const x3 = cx + innerR * Math.cos(endAngle), y3 = cy + innerR * Math.sin(endAngle);
    const x4 = cx + innerR * Math.cos(startAngle), y4 = cy + innerR * Math.sin(startAngle);
    segments.push(
      <path key={i}
        d={`M${x1},${y1} A${outerR},${outerR} 0 0,1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 0,0 ${x4},${y4} Z`}
        fill={hslStr(segHue)} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
    );
  }
  const dots = highlights.map((h, i) => {
    const angle = (h / 360) * TAU - Math.PI / 2;
    return (
      <circle key={`d${i}`} cx={cx + dotR * Math.cos(angle)} cy={cy + dotR * Math.sin(angle)}
        r={7} fill={hslStr(h)} stroke="#fff" strokeWidth="2.5"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }} />
    );
  });
  const lines = connections.map((p, i) => {
    const a1 = (p[0] / 360) * TAU - Math.PI / 2, a2 = (p[1] / 360) * TAU - Math.PI / 2;
    return (
      <line key={`l${i}`}
        x1={cx + dotR * Math.cos(a1)} y1={cy + dotR * Math.sin(a1)}
        x2={cx + dotR * Math.cos(a2)} y2={cy + dotR * Math.sin(a2)}
        stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="4,3" />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={innerR - 1} fill="rgba(0,0,0,0.15)" />
      {segments}{lines}{dots}
    </svg>
  );
}

/* ── Export panel ── */
function ExportPanel({ hue, sat, lit, selectedHarmony, harmonies }) {
  const [toast, showToast] = useToast();
  const [format, setFormat] = useState("css");

  const harmony = harmonies.find((h) => h.key === selectedHarmony) || harmonies[0];
  const colors = harmony.getColors(hue);
  const hexColors = colors.map((h) => hslToHex(h, sat, lit));

  const roleNames = colors.length === 2
    ? ["primary", "secondary"]
    : colors.length === 3
    ? ["primary", "secondary", "accent"]
    : ["primary", "secondary", "accent", "highlight"];

  const outputs = {
    css: hexColors.map((hex, i) => `--color-${roleNames[i]}: ${hex};`).join("\n"),
    tailwind: JSON.stringify(
      Object.fromEntries(roleNames.map((name, i) => [name, hexColors[i]])),
      null, 2
    ),
    prompt: [
      `Use this color palette (${harmony.name} harmony):`,
      ...hexColors.map((hex, i) => `  ${roleNames[i]}: ${hex}`),
      "",
      "Apply the 60-30-10 rule:",
      `  60% dominant → ${hexColors[0]}`,
      `  30% secondary → ${hexColors[1] || hexColors[0]}`,
      `  10% accent → ${hexColors[2] || hexColors[1] || hexColors[0]}`,
      "",
      "Generate lighter/darker shades as needed for backgrounds, borders, and hover states.",
    ].join("\n"),
    json: JSON.stringify({
      harmony: selectedHarmony,
      colors: hexColors.map((hex, i) => ({
        role: roleNames[i],
        hex,
        hsl: `hsl(${colors[i]}, ${sat}%, ${lit}%)`,
      })),
    }, null, 2),
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label}`);
  };

  const formatLabels = { css: "CSS Vars", tailwind: "Tailwind", prompt: "AI Prompt", json: "JSON" };

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: 24, marginTop: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace", marginBottom: 6 }}>
            Export Palette
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
            {harmony.name} — {hexColors.length} colors
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.keys(formatLabels).map((key) => (
            <button key={key} onClick={() => setFormat(key)} style={{
              background: format === key ? "rgba(255,255,255,0.12)" : "transparent",
              border: `1px solid ${format === key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 6, padding: "5px 12px", color: format === key ? "#e8e6e1" : "rgba(255,255,255,0.4)",
              fontSize: 11, fontFamily: "'Courier New', monospace", cursor: "pointer",
              transition: "all 0.15s",
            }}>
              {formatLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {hexColors.map((hex, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <CopyableSwatch hue={colors[i]} sat={sat} lit={lit} size={48} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "'Courier New', monospace" }}>
              {roleNames[i]}
            </span>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginTop: 16 }}>
        <pre style={{
          background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10, padding: "16px 16px 16px 16px", margin: 0,
          fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.65)",
          fontFamily: "'Courier New', monospace", overflowX: "auto",
          whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}>
          {outputs[format]}
        </pre>
        <button
          onClick={() => copy(outputs[format], formatLabels[format])}
          style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6, padding: "6px 14px", color: "rgba(255,255,255,0.6)",
            fontSize: 11, fontFamily: "'Courier New', monospace", cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.15)"; e.target.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.08)"; e.target.style.color = "rgba(255,255,255,0.6)"; }}
        >
          Copy
        </button>
      </div>

      <Toast {...toast} />
    </div>
  );
}

/* ── Ratio bar ── */
function RatioBar() {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 18 }}>
        <div style={{ width: "60%", background: "#2c3e6b", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>60%</span>
        </div>
        <div style={{ width: "30%", background: "#5a8f7b", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>30%</span>
        </div>
        <div style={{ width: "10%", background: "#e8a838", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>10%</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Dominant</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Secondary</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Accent</span>
      </div>
    </div>
  );
}

/* ── Harmony definitions ── */
const HARMONIES = [
  {
    key: "complementary", name: "Complementary", tag: "High Contrast",
    desc: "Opposite on the wheel. Maximum contrast — one color makes the other vibrate. Use one as dominant, the other sparingly as accent.",
    spotIt: "Look for two colors that feel electric together. Movie posters (teal & orange), stop signs (red & green surroundings).",
    getColors: (h) => [h, normHue(h + 180)],
    getConnections: (h) => [[h, normHue(h + 180)]],
  },
  {
    key: "analogous", name: "Analogous", tag: "Harmonious",
    desc: "Neighbors on the wheel (within ~30°). Naturally cohesive and calming. Hard to mess up — just watch that things don't blur together.",
    spotIt: "Sunsets (orange → pink → red), forests (yellow-green → green → teal). Feels unified and organic.",
    getColors: (h) => [normHue(h - 30), h, normHue(h + 30)],
    getConnections: (h) => [[normHue(h - 30), h], [h, normHue(h + 30)]],
  },
  {
    key: "triadic", name: "Triadic", tag: "Vibrant & Balanced",
    desc: "Three colors equally spaced (120° apart). Bold and energetic but balanced. Desaturate at least one to avoid a circus.",
    spotIt: "Superman (red, blue, yellow), primary color palettes. Three distinct hues that feel evenly weighted.",
    getColors: (h) => [h, normHue(h + 120), normHue(h + 240)],
    getConnections: (h) => [[h, normHue(h + 120)], [normHue(h + 120), normHue(h + 240)], [normHue(h + 240), h]],
  },
  {
    key: "split-complementary", name: "Split-Complementary", tag: "Contrast + Safety",
    desc: "One color + the two neighbors of its complement. Nearly as much contrast as complementary, but more forgiving and versatile.",
    spotIt: "When a palette has one standout color and two that sit close together on the opposite side. More nuanced than straight complementary.",
    getColors: (h) => [h, normHue(h + 150), normHue(h + 210)],
    getConnections: (h) => [[h, normHue(h + 150)], [h, normHue(h + 210)], [normHue(h + 150), normHue(h + 210)]],
  },
];

/* ── Hue slider ── */
function HueSlider({ hue, setHue }) {
  const trackRef = useRef(null);
  const interact = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setHue(Math.round((x / rect.width) * 360));
  };
  const onMouse = (e) => {
    e.preventDefault(); interact(e.clientX);
    const move = (ev) => interact(ev.clientX);
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };
  const onTouch = (e) => {
    interact(e.touches[0].clientX);
    const move = (ev) => { ev.preventDefault(); interact(ev.touches[0].clientX); };
    const end = () => { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
    window.addEventListener("touchmove", move, { passive: false }); window.addEventListener("touchend", end);
  };
  const gradStops = Array.from({ length: 13 }, (_, i) => {
    const h = (i / 12) * 360;
    return `hsl(${h}, 75%, 55%) ${(i / 12) * 100}%`;
  }).join(", ");

  return (
    <div>
      <div ref={trackRef} onMouseDown={onMouse} onTouchStart={onTouch} style={{
        position: "relative", height: 28, borderRadius: 14, cursor: "pointer",
        background: `linear-gradient(to right, ${gradStops})`,
        border: "2px solid rgba(255,255,255,0.1)", boxShadow: "inset 0 1px 4px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          position: "absolute", left: `${(hue / 360) * 100}%`, top: "50%",
          transform: "translate(-50%, -50%)", width: 22, height: 22, borderRadius: "50%",
          background: hslStr(hue), border: "3px solid #fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)", pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

/* ── Linear slider (for sat/lightness) ── */
function LinearSlider({ value, setValue, min = 0, max = 100, gradientFn }) {
  const trackRef = useRef(null);
  const interact = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setValue(Math.round(min + (x / rect.width) * (max - min)));
  };
  const onMouse = (e) => {
    e.preventDefault(); interact(e.clientX);
    const move = (ev) => interact(ev.clientX);
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };
  const onTouch = (e) => {
    interact(e.touches[0].clientX);
    const move = (ev) => { ev.preventDefault(); interact(ev.touches[0].clientX); };
    const end = () => { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
    window.addEventListener("touchmove", move, { passive: false }); window.addEventListener("touchend", end);
  };
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div ref={trackRef} onMouseDown={onMouse} onTouchStart={onTouch} style={{
        position: "relative", height: 20, borderRadius: 10, cursor: "pointer",
        background: gradientFn ? gradientFn() : "linear-gradient(to right, #333, #fff)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{
          position: "absolute", left: `${pct}%`, top: "50%",
          transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%",
          background: "#fff", border: "2px solid rgba(0,0,0,0.3)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)", pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function Paletta() {
  const [hue, setHue] = useState(210);
  const [sat, setSat] = useState(70);
  const [lit, setLit] = useState(55);
  const [selectedHarmony, setSelectedHarmony] = useState("complementary");

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e8e6e1", fontFamily: "'Georgia', 'Cambria', serif" }}>
      {/* Header */}
      <div style={{
        padding: "48px 32px 36px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 4, color: "rgba(255,255,255,0.3)", marginBottom: 12, fontFamily: "'Courier New', monospace" }}>
            Explore · Refine · Export
          </div>
          <h1 style={{
            fontSize: 40, fontWeight: 400, margin: 0, lineHeight: 1.2,
            background: "linear-gradient(135deg, #e8e6e1 0%, #a0998e 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontStyle: "italic",
          }}>
            Paletta
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginTop: 12, maxWidth: 560, lineHeight: 1.6, fontStyle: "italic" }}>
            Dial in your palette visually, then export as CSS variables, JSON, or a ready-to-paste prompt for Claude Code. Click any swatch to copy its hex.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 32px 48px" }}>
        {/* Controls */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16, padding: 24, marginBottom: 20,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>Hue</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>{hue}°</span>
              </div>
              <HueSlider hue={hue} setHue={setHue} />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>Saturation</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>{sat}%</span>
                </div>
                <LinearSlider value={sat} setValue={setSat}
                  gradientFn={() => `linear-gradient(to right, hsl(${hue}, 0%, ${lit}%), hsl(${hue}, 100%, ${lit}%))`} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>Lightness</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>{lit}%</span>
                </div>
                <LinearSlider value={lit} setValue={setLit}
                  gradientFn={() => `linear-gradient(to right, hsl(${hue}, ${sat}%, 10%), hsl(${hue}, ${sat}%, 50%), hsl(${hue}, ${sat}%, 90%))`} />
              </div>
            </div>
          </div>
        </div>

        {/* Harmony Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {HARMONIES.map((harmony) => {
            const colors = harmony.getColors(hue);
            const connections = harmony.getConnections(hue);
            const isSelected = selectedHarmony === harmony.key;
            return (
              <div key={harmony.key}
                onClick={() => setSelectedHarmony(harmony.key)}
                style={{
                  background: isSelected ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isSelected ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 16, padding: 24, display: "flex", gap: 24,
                  alignItems: "flex-start", flexWrap: "wrap", cursor: "pointer",
                  transition: "all 0.2s",
                  outline: isSelected ? `2px solid ${hslStr(hue, 40, 45)}` : "2px solid transparent",
                  outlineOffset: -2,
                }}>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <ColorWheel hue={hue} highlights={colors} connections={connections} size={140} />
                  <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                    {colors.map((c, i) => (
                      <CopyableSwatch key={i} hue={c} sat={sat} lit={lit} size={38} />
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: hslStr(hue, 50, 65) }} />}
                    <h2 style={{ fontSize: 20, fontWeight: 400, margin: 0 }}>{harmony.name}</h2>
                    <span style={{
                      fontSize: 10, textTransform: "uppercase", letterSpacing: 2,
                      color: hslStr(hue, 50, 65), background: `${hslStr(hue, 40, 20)}44`,
                      padding: "3px 10px", borderRadius: 20, fontFamily: "'Courier New', monospace",
                    }}>{harmony.tag}</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.5)", marginTop: 8, marginBottom: 0 }}>
                    {harmony.desc}
                  </p>
                  <div style={{
                    marginTop: 12, padding: "8px 12px", background: "rgba(255,255,255,0.03)",
                    borderLeft: `2px solid ${hslStr(hue, 40, 45)}`, borderRadius: "0 6px 6px 0",
                  }}>
                    <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.25)", fontFamily: "'Courier New', monospace" }}>
                      How to spot it
                    </span>
                    <p style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
                      {harmony.spotIt}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Export Panel */}
        <ExportPanel hue={hue} sat={sat} lit={lit} selectedHarmony={selectedHarmony} harmonies={HARMONIES} />

        {/* 60-30-10 */}
        <div style={{ marginTop: 20, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 400, margin: 0 }}>The 60-30-10 Rule</h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
            Once you{"'"}ve picked your colors, distribute them unevenly. The dominant color anchors the design, the secondary supports it, and the accent draws the eye to what matters.
          </p>
          <RatioBar />
        </div>

        {/* Tips */}
        <div style={{ marginTop: 20, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 400, margin: 0 }}>Training Your Eye</h2>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { num: "01", title: "Start with nature", text: "Sunsets, birds, coral reefs — nature has already solved color harmony." },
              { num: "02", title: "Squint at designs you admire", text: "Squinting blurs detail and reveals the underlying 2-3 dominant hues." },
              { num: "03", title: "Count the hues", text: "Good palettes rarely use more than 3. More likely means tints/shades of the same hues." },
              { num: "04", title: "Check saturation, not just hue", text: "Professional palettes use desaturated tones. Max saturation feels like a toy." },
              { num: "05", title: "Use tools shamelessly", text: "Coolors, Adobe Color, Realtime Colors — no designer picks colors from memory." },
            ].map((tip) => (
              <div key={tip.num} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, color: hslStr(hue, 40, 55), fontFamily: "'Courier New', monospace", flexShrink: 0, marginTop: 1 }}>
                  {tip.num}
                </span>
                <div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{tip.title}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>{tip.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
