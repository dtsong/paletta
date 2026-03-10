import { useState, useRef, useCallback, useEffect } from "react";

const TAU = Math.PI * 2;
const WHEEL_COLORS = 24;
const r2 = (n) => Math.round(n * 100) / 100;

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
        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(hex); showToast(`Copied ${hex}`); }}
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
function ColorWheel({ hue, highlights, connections, size = 120 }) {
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR - 18;
  const dotR = (outerR + innerR) / 2;
  const segments = [];
  for (let i = 0; i < WHEEL_COLORS; i++) {
    const startAngle = (i / WHEEL_COLORS) * TAU - Math.PI / 2;
    const endAngle = ((i + 1) / WHEEL_COLORS) * TAU - Math.PI / 2;
    const segHue = (i / WHEEL_COLORS) * 360;
    const x1 = r2(cx + outerR * Math.cos(startAngle)), y1 = r2(cy + outerR * Math.sin(startAngle));
    const x2 = r2(cx + outerR * Math.cos(endAngle)), y2 = r2(cy + outerR * Math.sin(endAngle));
    const x3 = r2(cx + innerR * Math.cos(endAngle)), y3 = r2(cy + innerR * Math.sin(endAngle));
    const x4 = r2(cx + innerR * Math.cos(startAngle)), y4 = r2(cy + innerR * Math.sin(startAngle));
    segments.push(
      <path key={i}
        d={`M${x1},${y1} A${outerR},${outerR} 0 0,1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 0,0 ${x4},${y4} Z`}
        fill={hslStr(segHue)} stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
    );
  }
  const dots = highlights.map((h, i) => {
    const angle = (h / 360) * TAU - Math.PI / 2;
    return (
      <circle key={`d${i}`} cx={r2(cx + dotR * Math.cos(angle))} cy={r2(cy + dotR * Math.sin(angle))}
        r={6} fill={hslStr(h)} stroke="#fff" strokeWidth="2"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }} />
    );
  });
  const lines = connections.map((p, i) => {
    const a1 = (p[0] / 360) * TAU - Math.PI / 2, a2 = (p[1] / 360) * TAU - Math.PI / 2;
    return (
      <line key={`l${i}`}
        x1={r2(cx + dotR * Math.cos(a1))} y1={r2(cy + dotR * Math.sin(a1))}
        x2={r2(cx + dotR * Math.cos(a2))} y2={r2(cy + dotR * Math.sin(a2))}
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
function ExportPanel({ hue, sat, lit, selectedHarmony, harmonies, isMobile }) {
  const [toast, showToast] = useToast();
  const [format, setFormat] = useState("prompt");

  const harmony = harmonies.find((h) => h.key === selectedHarmony) || harmonies[0];
  const colors = harmony.getColors(hue);
  const hexColors = colors.map((h) => hslToHex(h, sat, lit));

  const roleNames = colors.length === 2
    ? ["primary", "secondary"]
    : colors.length === 3
    ? ["primary", "secondary", "accent"]
    : ["primary", "secondary", "accent", "highlight"];

  const outputs = {
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
    css: hexColors.map((hex, i) => `--color-${roleNames[i]}: ${hex};`).join("\n"),
    tailwind: JSON.stringify(
      Object.fromEntries(roleNames.map((name, i) => [name, hexColors[i]])),
      null, 2
    ),
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

  const formatLabels = isMobile
    ? { prompt: "AI", css: "CSS", tailwind: "TW", json: "JSON" }
    : { prompt: "AI Prompt", css: "CSS Vars", tailwind: "Tailwind", json: "JSON" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>
          Export
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.keys(formatLabels).map((key) => (
            <button key={key} onClick={() => setFormat(key)} style={{
              background: format === key ? "rgba(255,255,255,0.12)" : "transparent",
              border: `1px solid ${format === key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 6, padding: isMobile ? "8px 10px" : "4px 10px",
              color: format === key ? "#e8e6e1" : "rgba(255,255,255,0.4)",
              fontSize: 10, fontFamily: "'Courier New', monospace", cursor: "pointer",
              transition: "all 0.15s",
            }}>
              {formatLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {hexColors.map((hex, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <CopyableSwatch hue={colors[i]} sat={sat} lit={lit} size={isMobile ? 38 : 40} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "'Courier New', monospace" }}>
              {roleNames[i]}
            </span>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <pre style={{
          background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10, padding: "14px 14px 14px 14px", margin: 0,
          fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.65)",
          fontFamily: "'Courier New', monospace", overflowY: "auto",
          whiteSpace: "pre-wrap", wordBreak: "break-all",
          height: "100%", boxSizing: "border-box",
        }}>
          {outputs[format]}
        </pre>
        <button
          onClick={() => copy(outputs[format], formatLabels[format])}
          style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6, padding: isMobile ? "10px 16px" : "5px 12px",
            color: "rgba(255,255,255,0.6)",
            fontSize: 10, fontFamily: "'Courier New', monospace", cursor: "pointer",
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
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace", marginBottom: 6 }}>
        60-30-10 Rule
      </div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 16 }}>
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
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Dominant</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Secondary</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Accent</span>
      </div>
    </div>
  );
}

/* ── Harmony definitions ── */
const HARMONIES = [
  {
    key: "complementary", name: "Complementary", shortName: "Comp", tag: "High Contrast",
    desc: "Opposite on the wheel. Maximum contrast — one color makes the other vibrate. Use one as dominant, the other sparingly as accent.",
    spotIt: "Look for two colors that feel electric together. Movie posters (teal & orange), stop signs (red & green surroundings).",
    getColors: (h) => [h, normHue(h + 180)],
    getConnections: (h) => [[h, normHue(h + 180)]],
  },
  {
    key: "analogous", name: "Analogous", shortName: "Analog", tag: "Harmonious",
    desc: "Neighbors on the wheel (within ~30°). Naturally cohesive and calming. Hard to mess up — just watch that things don't blur together.",
    spotIt: "Sunsets (orange → pink → red), forests (yellow-green → green → teal). Feels unified and organic.",
    getColors: (h) => [normHue(h - 30), h, normHue(h + 30)],
    getConnections: (h) => [[normHue(h - 30), h], [h, normHue(h + 30)]],
  },
  {
    key: "triadic", name: "Triadic", shortName: "Triad", tag: "Vibrant & Balanced",
    desc: "Three colors equally spaced (120° apart). Bold and energetic but balanced. Desaturate at least one to avoid a circus.",
    spotIt: "Superman (red, blue, yellow), primary color palettes. Three distinct hues that feel evenly weighted.",
    getColors: (h) => [h, normHue(h + 120), normHue(h + 240)],
    getConnections: (h) => [[h, normHue(h + 120)], [normHue(h + 120), normHue(h + 240)], [normHue(h + 240), h]],
  },
  {
    key: "split-complementary", name: "Split-Complementary", shortName: "Split", tag: "Contrast + Safety",
    desc: "One color + the two neighbors of its complement. Nearly as much contrast as complementary, but more forgiving and versatile.",
    spotIt: "When a palette has one standout color and two that sit close together on the opposite side. More nuanced than straight complementary.",
    getColors: (h) => [h, normHue(h + 150), normHue(h + 210)],
    getConnections: (h) => [[h, normHue(h + 150)], [h, normHue(h + 210)], [normHue(h + 150), normHue(h + 210)]],
  },
];

/* ── Hue slider ── */
function HueSlider({ hue, setHue, isMobile }) {
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

  const trackHeight = isMobile ? 32 : 24;
  const thumbSize = isMobile ? 24 : 18;

  return (
    <div ref={trackRef} onMouseDown={onMouse} onTouchStart={onTouch} style={{
      position: "relative", height: trackHeight, borderRadius: trackHeight / 2, cursor: "pointer", flex: 1,
      background: `linear-gradient(to right, ${gradStops})`,
      border: "2px solid rgba(255,255,255,0.1)", boxShadow: "inset 0 1px 4px rgba(0,0,0,0.3)",
    }}>
      <div style={{
        position: "absolute", left: `${(hue / 360) * 100}%`, top: "50%",
        transform: "translate(-50%, -50%)", width: thumbSize, height: thumbSize, borderRadius: "50%",
        background: hslStr(hue), border: "3px solid #fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)", pointerEvents: "none",
      }} />
    </div>
  );
}

/* ── Linear slider (for sat/lightness) ── */
function LinearSlider({ value, setValue, min = 0, max = 100, gradientFn, label, isMobile }) {
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

  const trackHeight = isMobile ? 28 : 16;
  const thumbSize = isMobile ? 22 : 14;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>{label}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>{value}%</span>
      </div>
      <div ref={trackRef} onMouseDown={onMouse} onTouchStart={onTouch} style={{
        position: "relative", height: trackHeight, borderRadius: trackHeight / 2, cursor: "pointer",
        background: gradientFn ? gradientFn() : "linear-gradient(to right, #333, #fff)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{
          position: "absolute", left: `${pct}%`, top: "50%",
          transform: "translate(-50%, -50%)", width: thumbSize, height: thumbSize, borderRadius: "50%",
          background: "#fff", border: "2px solid rgba(0,0,0,0.3)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)", pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

/* ── Tour steps ── */
const TOUR_STEPS = [
  {
    target: "tour-hue",
    title: "Set your base hue",
    body: "Drag anywhere on the spectrum to choose your starting color. Everything else responds to this.",
    position: "below",
  },
  {
    target: "tour-harmony",
    title: "Explore harmonies",
    body: "Switch between four classic color relationships. Each rearranges the wheel and generates a new palette.",
    position: "below",
  },
  {
    target: "tour-swatches",
    title: "Click to copy",
    body: "Every swatch is clickable. Tap one to copy its hex value straight to your clipboard.",
    position: "right",
  },
  {
    target: "tour-export",
    title: "Export your palette",
    body: "AI Prompt gives you a ready-to-paste snippet for Claude or GPT. Switch formats with the tabs above.",
    position: "left",
  },
  {
    target: "tour-sliders",
    title: "Refine with precision",
    body: "Saturation and lightness let you dial in the exact mood — muted and professional or vivid and bold.",
    position: "above",
  },
];

/* ── Tour overlay ── */
function TourOverlay({ step, totalSteps, currentStep, onNext, onPrev, onClose, isMobile }) {
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
    };
    update();
    // fade in after rect is measured
    requestAnimationFrame(() => setVisible(true));
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("resize", update); setVisible(false); };
  }, [step.target]);

  if (!rect) return null;

  // Position the callout card relative to the spotlight
  const cardStyle = (() => {
    if (isMobile) {
      // On mobile, always position below with full-width centering
      return {
        position: "fixed", zIndex: 10002,
        top: rect.top + rect.height + 16,
        left: 16, right: 16,
        maxWidth: "calc(100vw - 32px)",
      };
    }
    const card = { position: "fixed", zIndex: 10002, maxWidth: 280 };
    const pad = 16;
    if (step.position === "below") {
      return { ...card, top: rect.top + rect.height + pad, left: rect.left + rect.width / 2, transform: "translateX(-50%)" };
    }
    if (step.position === "above") {
      return { ...card, bottom: window.innerHeight - rect.top + pad, left: rect.left + rect.width / 2, transform: "translateX(-50%)" };
    }
    if (step.position === "right") {
      return { ...card, top: rect.top + rect.height / 2, left: rect.left + rect.width + pad, transform: "translateY(-50%)" };
    }
    // left
    return { ...card, top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + pad, transform: "translateY(-50%)" };
  })();

  return (
    <>
      {/* Dim overlay with spotlight cutout via clip-path */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.7)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.35s ease",
          clipPath: `polygon(
            0% 0%, 0% 100%, ${rect.left}px 100%, ${rect.left}px ${rect.top}px,
            ${rect.left + rect.width}px ${rect.top}px, ${rect.left + rect.width}px ${rect.top + rect.height}px,
            ${rect.left}px ${rect.top + rect.height}px, ${rect.left}px 100%, 100% 100%, 100% 0%
          )`,
        }}
      />

      {/* Spotlight glow ring */}
      <div style={{
        position: "fixed", zIndex: 10001, pointerEvents: "none",
        top: rect.top - 2, left: rect.left - 2,
        width: rect.width + 4, height: rect.height + 4,
        borderRadius: 10,
        boxShadow: "0 0 0 3px rgba(255,255,255,0.2), 0 0 24px rgba(255,255,255,0.08)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease 0.1s",
      }} />

      {/* Callout card */}
      <div style={{
        ...cardStyle,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease 0.15s",
      }}>
        <div style={{
          background: "rgba(20,22,30,0.95)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
          padding: "18px 20px", boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
          ...(isMobile ? { overflowY: "auto", maxHeight: "50vh" } : {}),
        }}>
          {/* Step indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          }}>
            <span style={{
              fontSize: 10, fontFamily: "'Courier New', monospace",
              color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase",
            }}>
              {String(currentStep + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Title */}
          <div style={{
            fontSize: 15, fontWeight: 400, color: "#e8e6e1",
            fontFamily: "'Georgia', 'Cambria', serif", fontStyle: "italic",
            marginBottom: 6,
          }}>
            {step.title}
          </div>

          {/* Body */}
          <div style={{
            fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.5)",
            fontFamily: "'Georgia', 'Cambria', serif",
          }}>
            {step.body}
          </div>

          {/* Navigation */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 14, gap: 8,
          }}>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", padding: isMobile ? "8px 0" : 0,
                color: "rgba(255,255,255,0.25)", fontSize: 10, cursor: "pointer",
                fontFamily: "'Courier New', monospace", letterSpacing: 1,
              }}
            >
              Skip tour
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              {currentStep > 0 && (
                <button
                  onClick={onPrev}
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6, padding: isMobile ? "8px 16px" : "5px 12px",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 10, fontFamily: "'Courier New', monospace", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  Back
                </button>
              )}
              <button
                onClick={onNext}
                style={{
                  background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 6, padding: isMobile ? "8px 16px" : "5px 14px",
                  color: "#e8e6e1",
                  fontSize: 10, fontFamily: "'Courier New', monospace", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {currentStep === totalSteps - 1 ? "Done" : "Next"}
              </button>
            </div>
          </div>

          {/* Dot indicators */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 5, marginTop: 12,
          }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} style={{
                width: i === currentStep ? 14 : 5, height: 5, borderRadius: 3,
                background: i === currentStep ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)",
                transition: "all 0.25s ease",
              }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main component ── */
export default function Paletta() {
  const [hue, setHue] = useState(210);
  const [sat, setSat] = useState(70);
  const [lit, setLit] = useState(55);
  const [selectedHarmony, setSelectedHarmony] = useState("complementary");
  const [isNarrow, setIsNarrow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tourStep, setTourStep] = useState(-1); // -1 = inactive

  useEffect(() => {
    const check = () => {
      setIsNarrow(window.innerWidth < 1024);
      setIsMobile(window.innerWidth < 640);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-start tour on first visit
  useEffect(() => {
    const seen = localStorage.getItem("paletta-tour-seen");
    if (!seen) {
      // slight delay so the layout settles
      const t = setTimeout(() => setTourStep(0), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const closeTour = useCallback(() => {
    setTourStep(-1);
    localStorage.setItem("paletta-tour-seen", "1");
  }, []);

  const nextTourStep = useCallback(() => {
    setTourStep((s) => {
      if (s >= TOUR_STEPS.length - 1) {
        localStorage.setItem("paletta-tour-seen", "1");
        return -1;
      }
      return s + 1;
    });
  }, []);

  const prevTourStep = useCallback(() => {
    setTourStep((s) => Math.max(0, s - 1));
  }, []);

  const harmony = HARMONIES.find((h) => h.key === selectedHarmony) || HARMONIES[0];
  const harmonyColors = harmony.getColors(hue);
  const harmonyConnections = harmony.getConnections(hue);

  return (
    <div style={{
      minHeight: "100vh",
      ...(isMobile ? {} : { height: "100vh", overflow: "hidden" }),
      background: "#0f1117", color: "#e8e6e1",
      fontFamily: "'Georgia', 'Cambria', serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header bar — 52px */}
      <div style={{
        height: 52, minHeight: 52, display: "flex", alignItems: "center",
        gap: isMobile ? 10 : 20,
        padding: isMobile ? "0 12px" : "0 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
      }}>
        <h1 style={{
          fontSize: isMobile ? 17 : 20, fontWeight: 400, margin: 0, flexShrink: 0,
          background: "linear-gradient(135deg, #e8e6e1 0%, #a0998e 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          fontStyle: "italic",
        }}>
          Paletta
        </h1>
        <div data-tour="tour-hue" style={{ flex: 1, display: "flex" }}>
          <HueSlider hue={hue} setHue={setHue} isMobile={isMobile} />
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace", flexShrink: 0 }}>{hue}°</span>
        {/* Tour trigger */}
        <button
          onClick={() => setTourStep(0)}
          title="Take the tour"
          style={{
            width: isMobile ? 36 : 26, height: isMobile ? 36 : 26, borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.35)", fontSize: isMobile ? 14 : 12,
            fontFamily: "'Georgia', 'Cambria', serif", fontStyle: "italic",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#e8e6e1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
        >
          ?
        </button>
      </div>

      {/* Two-column body */}
      <div style={{
        flex: 1, display: "flex", flexDirection: isNarrow ? "column" : "row",
        minHeight: 0,
        ...(isMobile ? {} : { overflow: "hidden" }),
      }}>
        {/* Left panel — Harmony */}
        <div style={{
          width: isNarrow ? "100%" : "55%",
          ...(isNarrow
            ? { flex: isMobile ? "none" : 1, minHeight: 0 }
            : {}),
          overflowY: isMobile ? "visible" : "auto",
          padding: isMobile ? 14 : 20,
          borderRight: isNarrow ? "none" : "1px solid rgba(255,255,255,0.06)",
          borderBottom: isNarrow ? "1px solid rgba(255,255,255,0.06)" : "none",
          display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16,
        }}>
          {/* Harmony section label */}
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>
            Harmony
          </div>

          {/* Harmony tab bar */}
          <div data-tour="tour-harmony" style={{ display: "flex", gap: 4 }}>
            {HARMONIES.map((h) => (
              <button key={h.key} onClick={() => setSelectedHarmony(h.key)} style={{
                background: selectedHarmony === h.key ? "rgba(255,255,255,0.1)" : "transparent",
                border: `1px solid ${selectedHarmony === h.key ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 6, padding: isMobile ? "8px 6px" : "6px 14px",
                color: selectedHarmony === h.key ? "#e8e6e1" : "rgba(255,255,255,0.4)",
                fontSize: 11, fontFamily: "'Courier New', monospace", cursor: "pointer",
                transition: "all 0.15s", flex: 1,
              }}>
                {isMobile ? h.shortName : h.name.replace("-", " ")}
              </button>
            ))}
          </div>

          {/* Selected harmony detail card */}
          <div style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: isMobile ? 14 : 20,
            display: "flex", gap: isMobile ? 14 : 20,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "center" : "flex-start",
            flexWrap: isMobile ? "nowrap" : "wrap",
            outline: `2px solid ${hslStr(hue, 40, 45)}`, outlineOffset: -2,
          }}>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ColorWheel hue={hue} highlights={harmonyColors} connections={harmonyConnections} size={120} />
              <div data-tour="tour-swatches" style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {harmonyColors.map((c, i) => (
                  <CopyableSwatch key={i} hue={c} sat={sat} lit={lit} size={isMobile ? 38 : 34} />
                ))}
              </div>
            </div>
            <div style={{ flex: 1, ...(isMobile ? { width: "100%" } : { minWidth: 180 }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 18, fontWeight: 400, margin: 0 }}>{harmony.name}</h2>
                <span style={{
                  fontSize: 9, textTransform: "uppercase", letterSpacing: 2,
                  color: hslStr(hue, 50, 65), background: `${hslStr(hue, 40, 20)}44`,
                  padding: "2px 8px", borderRadius: 20, fontFamily: "'Courier New', monospace",
                }}>{harmony.tag}</span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.5)", marginTop: 6, marginBottom: 0 }}>
                {harmony.desc}
              </p>
              <div style={{
                marginTop: 10, padding: "6px 10px", background: "rgba(255,255,255,0.03)",
                borderLeft: `2px solid ${hslStr(hue, 40, 45)}`, borderRadius: "0 6px 6px 0",
              }}>
                <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.25)", fontFamily: "'Courier New', monospace" }}>
                  How to spot it
                </span>
                <p style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(255,255,255,0.4)", margin: "3px 0 0" }}>
                  {harmony.spotIt}
                </p>
              </div>
            </div>
          </div>

          {/* Sat/Lightness sliders */}
          <div data-tour="tour-sliders" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <LinearSlider label="Saturation" value={sat} setValue={setSat} isMobile={isMobile}
              gradientFn={() => `linear-gradient(to right, hsl(${hue}, 0%, ${lit}%), hsl(${hue}, 100%, ${lit}%))`} />
            <LinearSlider label="Lightness" value={lit} setValue={setLit} isMobile={isMobile}
              gradientFn={() => `linear-gradient(to right, hsl(${hue}, ${sat}%, 10%), hsl(${hue}, ${sat}%, 50%), hsl(${hue}, ${sat}%, 90%))`} />
          </div>
        </div>

        {/* Right panel — Export + educational */}
        <div style={{
          width: isNarrow ? "100%" : "45%",
          ...(isNarrow
            ? { flex: isMobile ? "none" : 1, minHeight: 0 }
            : {}),
          overflowY: isMobile ? "visible" : "auto",
          padding: isMobile ? 14 : 20,
          display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16,
        }}>
          <div data-tour="tour-export">
            <ExportPanel hue={hue} sat={sat} lit={lit} selectedHarmony={selectedHarmony} harmonies={HARMONIES} isMobile={isMobile} />
          </div>

          {/* 60-30-10 compact */}
          <RatioBar />

          {/* Tips — compact */}
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace", marginBottom: 6 }}>
              Training Your Eye
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { num: "01", text: "Start with nature — sunsets, birds, coral reefs have solved color harmony." },
                { num: "02", text: "Squint at designs you admire to reveal the 2-3 dominant hues." },
                { num: "03", text: "Good palettes rarely exceed 3 hues. More likely means tints of the same." },
                { num: "04", text: "Check saturation — professional palettes use desaturated tones." },
                { num: "05", text: "Use tools shamelessly — Coolors, Adobe Color, Realtime Colors." },
              ].map((tip) => (
                <div key={tip.num} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontSize: 9, color: hslStr(hue, 40, 55), fontFamily: "'Courier New', monospace", flexShrink: 0 }}>
                    {tip.num}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tour overlay */}
      {tourStep >= 0 && tourStep < TOUR_STEPS.length && (
        <TourOverlay
          step={TOUR_STEPS[tourStep]}
          totalSteps={TOUR_STEPS.length}
          currentStep={tourStep}
          onNext={nextTourStep}
          onPrev={prevTourStep}
          onClose={closeTour}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
