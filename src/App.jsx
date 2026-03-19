import { useState, useEffect, useCallback } from "react";

const ROUTINE_BLOCKS = [
  { id: "reading", duration: 60, label: "기술 서적 읽기", icon: "📖", color: "#6366F1" },
  { id: "interview", duration: 60, label: "면접 연습", icon: "🎯", color: "#4ECDC4" },
  { id: "lunch", duration: 60, label: "점심 + 휴식", icon: "🍚", color: "#9CA3AF" },
  { id: "jobs", duration: 60, label: "채용공고 + 지원", icon: "📋", color: "#F59E0B" },
  { id: "star", duration: 120, label: "STAR 정리 / 이력서", icon: "✏️", color: "#FF6B35" },
  { id: "break", duration: 15, label: "휴식", icon: "☕", color: "#9CA3AF" },
  { id: "english", duration: 45, label: "영어 + 복기", icon: "📝", color: "#A78BFA" },
];

const DEFAULT_START_HOUR = 10;
const START_TIME_KEY = "chris-routine-start-time";

const formatTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getBlocksWithTime = (startHour) => {
  let offset = startHour * 60;
  return ROUTINE_BLOCKS.map(block => {
    const start = offset;
    offset += block.duration;
    return { ...block, time: `${formatTime(start)}–${formatTime(offset)}` };
  });
};

const loadStartTime = () => {
  try {
    const val = localStorage.getItem(START_TIME_KEY);
    return val !== null ? Number(val) : DEFAULT_START_HOUR;
  } catch { return DEFAULT_START_HOUR; }
};

const STORAGE_KEY = "chris-routine-tracker";
const getToday = () => new Date().toISOString().slice(0, 10);

const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const persistData = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch (e) { console.error("Storage error:", e); }
};

export default function App() {
  const [data, setData] = useState(() => loadData());
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [startHour, setStartHour] = useState(() => loadStartTime());
  const today = getToday();
  const weekDates = getWeekDates();
  const blocksWithTime = getBlocksWithTime(startHour);

  const handleStartHourChange = (newHour) => {
    setStartHour(newHour);
    try { localStorage.setItem(START_TIME_KEY, String(newHour)); } catch {}
  };

  useEffect(() => {
    if (data[today]?.note) setNote(data[today].note);
  }, []);

  const updateData = (newData) => {
    setData(newData);
    persistData(newData);
  };

  const toggleBlock = (blockId) => {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData[today]) newData[today] = { blocks: {}, note: "" };
    const current = newData[today].blocks[blockId];
    if (!current) {
      newData[today].blocks[blockId] = { status: "done", time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) };
    } else if (current.status === "done") {
      newData[today].blocks[blockId] = { status: "skip", time: current.time };
    } else {
      delete newData[today].blocks[blockId];
    }
    updateData(newData);
  };

  const handleNoteBlur = () => {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData[today]) newData[today] = { blocks: {}, note: "" };
    newData[today].note = note;
    updateData(newData);
  };

  const getStats = (date) => {
    const dayData = data[date]?.blocks || {};
    const actionable = ROUTINE_BLOCKS.filter(b => b.id !== "lunch" && b.id !== "break");
    const done = actionable.filter(b => dayData[b.id]?.status === "done").length;
    return { done, total: actionable.length, pct: Math.round((done / actionable.length) * 100) };
  };

  const getStreak = () => {
    let streak = 0;
    const d = new Date();
    const actionable = ROUTINE_BLOCKS.filter(b => b.id !== "lunch" && b.id !== "break");
    while (true) {
      const dateStr = d.toISOString().slice(0, 10);
      const dayData = data[dateStr]?.blocks || {};
      const done = actionable.filter(b => dayData[b.id]?.status === "done").length;
      if (done >= Math.ceil(actionable.length * 0.5)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (dateStr === today) {
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const stats = getStats(today);
  const streak = getStreak();

  return (
    <div style={{ fontFamily: "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', sans-serif", maxWidth: 480, margin: "0 auto", padding: "0 16px 100px", color: "#1a1a1a", background: "#fff", minHeight: "100vh" }}>
      <div style={{ paddingTop: "env(safe-area-inset-top, 20px)" }} />

      {/* Header Card */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderRadius: 16, padding: "24px 20px", margin: "12px 0 16px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, letterSpacing: 1 }}>DAILY ROUTINE</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
              {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "8px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>🔥 {streak}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>연속일</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 0", flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.pct}%</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>달성률</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 0", flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.done}/{stats.total}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>완료</div>
          </div>
        </div>
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.1)", borderRadius: 6, height: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${stats.pct}%`, background: stats.pct >= 50 ? "linear-gradient(90deg, #4ECDC4, #44E5A0)" : "linear-gradient(90deg, #FF6B35, #FF8F65)", borderRadius: 6, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6, textAlign: "center" }}>
          {stats.pct >= 50 ? "오늘 목표 달성! 🎉" : "50% 넘기면 성공이야"}
        </div>
      </div>

      {/* Start Time */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12, padding: "8px 0" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#888" }}>시작 시간</span>
        <button onClick={() => handleStartHourChange(Math.max(0, startHour - 1))} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", color: "#555", WebkitTapHighlightColor: "transparent" }}>−</button>
        <span style={{ fontSize: 18, fontWeight: 800, minWidth: 52, textAlign: "center", color: "#1a1a2e" }}>{String(startHour).padStart(2, "0")}:00</span>
        <button onClick={() => handleStartHourChange(Math.min(23, startHour + 1))} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", color: "#555", WebkitTapHighlightColor: "transparent" }}>+</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 3, marginBottom: 16 }}>
        {[{ key: "today", label: "오늘" }, { key: "week", label: "이번 주" }, { key: "history", label: "기록" }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: activeTab === tab.key ? "#fff" : "transparent",
            color: activeTab === tab.key ? "#1a1a1a" : "#999",
            boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            WebkitTapHighlightColor: "transparent",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* TODAY */}
      {activeTab === "today" && (
        <>
          {blocksWithTime.map(block => {
            const bd = data[today]?.blocks?.[block.id];
            const isDone = bd?.status === "done";
            const isSkip = bd?.status === "skip";
            const isRest = block.id === "lunch" || block.id === "break";
            return (
              <div key={block.id} onClick={() => !isRest && toggleBlock(block.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px", marginBottom: 6, borderRadius: 12,
                cursor: isRest ? "default" : "pointer",
                background: isDone ? "#f0fdf4" : isSkip ? "#fef2f2" : "#fafafa",
                border: isDone ? "1.5px solid #86efac" : isSkip ? "1.5px solid #fca5a5" : "1.5px solid #f0f0f0",
                opacity: isRest ? 0.45 : 1,
                WebkitTapHighlightColor: "transparent",
              }}>
                <div style={{ fontSize: 22, width: 32, textAlign: "center", flexShrink: 0 }}>{block.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: isDone ? "#16a34a" : isSkip ? "#dc2626" : "#1a1a1a", textDecoration: isSkip ? "line-through" : "none" }}>{block.label}</span>
                    <span style={{ fontSize: 11, color: "#bbb" }}>{block.time}</span>
                  </div>
                  {bd?.time && <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{isDone ? "✅ 완료" : "⏭ 스킵"} {bd.time}</div>}
                </div>
                {!isRest && (
                  <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, background: isDone ? "#22c55e" : isSkip ? "#ef4444" : "#e8e8e8", color: isDone || isSkip ? "#fff" : "#ccc" }}>
                    {isDone ? "✓" : isSkip ? "–" : ""}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ fontSize: 11, color: "#bbb", textAlign: "center", margin: "8px 0 20px" }}>탭: 완료 → 스킵 → 초기화</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 8 }}>오늘의 메모</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={handleNoteBlur}
              placeholder="면접에서 배운 점, 지원한 곳, 느낀 점..."
              style={{ width: "100%", minHeight: 90, padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e8e8e8", background: "#fafafa", fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, WebkitAppearance: "none" }}
            />
          </div>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => { if (confirm("오늘 기록을 초기화할까요?")) { const nd = { ...data }; delete nd[today]; updateData(nd); setNote(""); } }}
              style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 8, padding: "8px 20px", fontSize: 12, color: "#aaa", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
              오늘 기록 초기화
            </button>
          </div>
        </>
      )}

      {/* WEEK */}
      {activeTab === "week" && (
        <div style={{ background: "#f8f9fa", borderRadius: 14, padding: "20px 16px" }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "space-between", marginBottom: 20 }}>
            {weekDates.map((date, i) => {
              const s = getStats(date);
              const isToday = date === today;
              const hasData = Object.keys(data[date]?.blocks || {}).length > 0;
              return (
                <div key={date} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 12, background: isToday ? "#1a1a2e" : "transparent" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isToday ? "#fff" : "#999", marginBottom: 8 }}>{DAY_LABELS[i]}</div>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: !hasData ? "#e5e5e5" : s.pct >= 50 ? "#22c55e" : "#FF6B35", color: !hasData ? "#bbb" : "#fff" }}>
                    {hasData ? s.pct : "·"}
                  </div>
                  <div style={{ fontSize: 10, color: isToday ? "rgba(255,255,255,0.5)" : "#ccc", marginTop: 6 }}>{date.slice(8)}일</div>
                </div>
              );
            })}
          </div>
          {weekDates.map((date, i) => {
            const hasData = Object.keys(data[date]?.blocks || {}).length > 0;
            if (!hasData) return null;
            const isToday = date === today;
            return (
              <div key={date} style={{ padding: "12px 14px", marginBottom: 6, background: isToday ? "#eef2ff" : "#fff", borderRadius: 10, border: isToday ? "1px solid #c7d2fe" : "1px solid #eee" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: isToday ? "#4338ca" : "#555" }}>
                  {DAY_LABELS[i]} ({date.slice(5)}){isToday && <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.6 }}>오늘</span>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {ROUTINE_BLOCKS.filter(b => b.id !== "lunch" && b.id !== "break").map(b => {
                    const s = data[date]?.blocks?.[b.id]?.status;
                    return <span key={b.id} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: s === "done" ? "#dcfce7" : s === "skip" ? "#fee2e2" : "#f3f4f6", color: s === "done" ? "#16a34a" : s === "skip" ? "#dc2626" : "#bbb" }}>{b.icon} {s === "done" ? "✓" : s === "skip" ? "–" : "·"}</span>;
                  })}
                </div>
                {data[date]?.note && <div style={{ fontSize: 12, color: "#888", marginTop: 6, lineHeight: 1.5 }}>💬 {data[date].note}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* HISTORY */}
      {activeTab === "history" && (
        <div>
          {Object.keys(data).filter(k => k.match(/^\d{4}-\d{2}-\d{2}$/)).sort().reverse().length === 0 ? (
            <div style={{ textAlign: "center", color: "#bbb", padding: "40px 0", fontSize: 14 }}>아직 기록이 없어요. 오늘부터 시작!</div>
          ) : (
            Object.keys(data).filter(k => k.match(/^\d{4}-\d{2}-\d{2}$/)).sort().reverse().map(date => {
              const s = getStats(date);
              const isToday = date === today;
              return (
                <div key={date} style={{ padding: "14px 16px", marginBottom: 6, background: isToday ? "#eef2ff" : "#fafafa", borderRadius: 12, border: isToday ? "1.5px solid #c7d2fe" : "1.5px solid #f0f0f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>
                      {new Date(date + "T00:00:00").toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })}
                      {isToday && <span style={{ fontSize: 10, marginLeft: 6, background: "#4338ca", color: "#fff", padding: "2px 6px", borderRadius: 4 }}>오늘</span>}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.pct >= 50 ? "#16a34a" : "#FF6B35" }}>{s.pct}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {ROUTINE_BLOCKS.filter(b => b.id !== "lunch" && b.id !== "break").map(b => {
                      const st = data[date]?.blocks?.[b.id]?.status;
                      return <span key={b.id} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: st === "done" ? "#dcfce7" : st === "skip" ? "#fee2e2" : "#f3f4f6", color: st === "done" ? "#16a34a" : st === "skip" ? "#dc2626" : "#bbb" }}>{b.icon} {st === "done" ? "✓" : st === "skip" ? "–" : "·"}</span>;
                    })}
                  </div>
                  {data[date]?.note && <div style={{ fontSize: 12, color: "#888", marginTop: 8, lineHeight: 1.5 }}>💬 {data[date].note}</div>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
