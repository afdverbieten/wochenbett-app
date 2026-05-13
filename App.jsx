import { useState } from "react";

// ── Hilfsfunktionen ──────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

function getDaysArray(birthDate, count = 14) {
  const days = [];
  const start = new Date(birthDate);
  start.setDate(start.getDate() + 1);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

const EMOJIS = ["🍲", "🥘", "🍜", "🫕", "🥗", "🍝", "🫔", "🥙", "🍱", "🫶"];

// ── Initialdaten ─────────────────────────────────────────────────
const INITIAL_BIRTHS = [
  {
    id: 1,
    babyName: "Mia",
    parentName: "Familie Müller",
    birthDate: "2026-05-01",
    mealDays: 14,
    note: "Erstgeburt, vegane Ernährung 🌿",
    meals: {
      "2026-05-02": { name: "Sarah K.", dish: "Linsensuppe & Brot", emoji: "🍲", confirmed: true },
      "2026-05-04": { name: "Thomas W.", dish: "Pasta Bolognese (vegan)", emoji: "🍝", confirmed: true },
      "2026-05-06": { name: "Julia M.", dish: "Gemüsecurry mit Reis", emoji: "🥘", confirmed: false },
    },
  },
];

// ── Hauptkomponente ──────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("home"); // home | list | detail | add-birth | add-meal
  const [births, setBirths] = useState(INITIAL_BIRTHS);
  const [selectedBirth, setSelectedBirth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // Formular-State
  const [birthForm, setBirthForm] = useState({ babyName: "", parentName: "", birthDate: "", mealDays: 14, note: "" });
  const [mealForm, setMealForm] = useState({ name: "", dish: "", emoji: "🍲" });
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addBirth() {
    if (!birthForm.babyName || !birthForm.parentName || !birthForm.birthDate) return;
    const newBirth = { ...birthForm, id: Date.now(), meals: {} };
    setBirths([newBirth, ...births]);
    setBirthForm({ babyName: "", parentName: "", birthDate: "", mealDays: 14, note: "" });
    showToast(`Geburt von ${birthForm.babyName} eingetragen! 🎉`);
    setView("list");
  }

  function addMeal() {
    if (!mealForm.name || !mealForm.dish) return;
    setBirths(births.map(b =>
      b.id === selectedBirth.id
        ? { ...b, meals: { ...b.meals, [selectedDay]: { ...mealForm, confirmed: false } } }
        : b
    ));
    setSelectedBirth(prev => ({
      ...prev,
      meals: { ...prev.meals, [selectedDay]: { ...mealForm, confirmed: false } }
    }));
    setMealForm({ name: "", dish: "", emoji: "🍲" });
    showToast("Essenslieferung eingetragen! 🎉");
    setView("detail");
  }

  function toggleConfirm(birthId, day) {
    setBirths(births.map(b => {
      if (b.id !== birthId) return b;
      const meals = { ...b.meals };
      if (meals[day]) meals[day] = { ...meals[day], confirmed: !meals[day].confirmed };
      return { ...b, meals };
    }));
    setSelectedBirth(prev => {
      if (!prev || prev.id !== birthId) return prev;
      const meals = { ...prev.meals };
      if (meals[day]) meals[day] = { ...meals[day], confirmed: !meals[day].confirmed };
      return { ...prev, meals };
    });
  }

  function openDetail(birth) {
    setSelectedBirth(birth);
    setView("detail");
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Background decoration */}
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#e74c3c" : "#4CAF50" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <button onClick={() => setView("home")} style={styles.logoBtn}>
          <span style={styles.logoIcon}>🌸</span>
          <span style={styles.logoText}>Wochenbett<span style={styles.logoBold}>Dienst</span></span>
        </button>
        <nav style={styles.nav}>
          <button onClick={() => setView("list")} style={styles.navBtn}>Übersicht</button>
          <button onClick={() => setView("add-birth")} style={styles.navBtnPrimary}>+ Geburt eintragen</button>
        </nav>
      </header>

      {/* Main content */}
      <main style={styles.main}>
        {view === "home" && <HomeView setView={setView} births={births} />}
        {view === "list" && <ListView births={births} openDetail={openDetail} setView={setView} />}
        {view === "detail" && selectedBirth && (
          <DetailView
            birth={births.find(b => b.id === selectedBirth.id) || selectedBirth}
            setView={setView}
            setSelectedDay={setSelectedDay}
            toggleConfirm={toggleConfirm}
          />
        )}
        {view === "add-birth" && (
          <AddBirthView form={birthForm} setForm={setBirthForm} onSubmit={addBirth} setView={setView} />
        )}
        {view === "add-meal" && selectedBirth && selectedDay && (
          <AddMealView
            birth={selectedBirth}
            day={selectedDay}
            form={mealForm}
            setForm={setMealForm}
            onSubmit={addMeal}
            setView={setView}
            emojis={EMOJIS}
          />
        )}
      </main>
    </div>
  );
}

// ── HOME ─────────────────────────────────────────────────────────
function HomeView({ setView, births }) {
  const totalMeals = births.reduce((s, b) => s + Object.keys(b.meals).length, 0);
  const confirmed = births.reduce((s, b) => s + Object.values(b.meals).filter(m => m.confirmed).length, 0);

  return (
    <div style={styles.homeWrap}>
      <div style={styles.heroBadge}>Gemeinschaft & Fürsorge</div>
      <h1 style={styles.heroTitle}>
        Gemeinsam füreinander <br />
        <span style={styles.heroAccent}>da sein.</span>
      </h1>
      <p style={styles.heroSub}>
        Wenn ein neues Leben beginnt, brauchen Familien Unterstützung.
        Hier koordinieren wir liebevoll zubereitete Abendessen für frischgebackene Eltern.
      </p>
      <div style={styles.heroActions}>
        <button onClick={() => setView("add-birth")} style={styles.heroBtnPrimary}>
          🍼 Geburt eintragen
        </button>
        <button onClick={() => setView("list")} style={styles.heroBtnSecondary}>
          Alle Familien anzeigen →
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { icon: "👶", val: births.length, label: "Neugeborene" },
          { icon: "🍽️", val: totalMeals, label: "Mahlzeiten geplant" },
          { icon: "✅", val: confirmed, label: "Bestätigt" },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statIcon}>{s.icon}</div>
            <div style={styles.statVal}>{s.val}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={styles.howSection}>
        <h2 style={styles.sectionTitle}>So funktioniert es</h2>
        <div style={styles.stepsRow}>
          {[
            { n: "1", icon: "🍼", title: "Geburt eintragen", text: "Trag Name, Eltern und Geburtsdatum ein." },
            { n: "2", icon: "📅", title: "Tag wählen", text: "Freunde wählen einen freien Tag in der Übersicht." },
            { n: "3", icon: "🍲", title: "Essen bringen", text: "Du trägst ein, was du kochst – die Familie freut sich!" },
          ].map(s => (
            <div key={s.n} style={styles.stepCard}>
              <div style={styles.stepNum}>{s.n}</div>
              <div style={styles.stepIcon}>{s.icon}</div>
              <div style={styles.stepTitle}>{s.title}</div>
              <div style={styles.stepText}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LIST ──────────────────────────────────────────────────────────
function ListView({ births, openDetail, setView }) {
  return (
    <div style={styles.pageWrap}>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Alle Familien</h2>
        <button onClick={() => setView("add-birth")} style={styles.navBtnPrimary}>+ Geburt eintragen</button>
      </div>
      {births.length === 0 && (
        <div style={styles.empty}>
          <div style={{ fontSize: 48 }}>🌸</div>
          <p>Noch keine Einträge. Trag die erste Geburt ein!</p>
          <button onClick={() => setView("add-birth")} style={styles.heroBtnPrimary}>Jetzt eintragen</button>
        </div>
      )}
      <div style={styles.cardGrid}>
        {births.map(birth => {
          const days = getDaysArray(birth.birthDate, birth.mealDays || 14);
          const filled = days.filter(d => birth.meals[d]).length;
          const pct = Math.round((filled / days.length) * 100);
          return (
            <div key={birth.id} style={styles.birthCard} onClick={() => openDetail(birth)}>
              <div style={styles.birthCardTop}>
                <div style={styles.babyAvatar}>👶</div>
                <div>
                  <div style={styles.babyName}>{birth.babyName}</div>
                  <div style={styles.parentName}>{birth.parentName}</div>
                </div>
              </div>
              <div style={styles.birthDate}>🗓 Geburtsdatum: {formatDate(birth.birthDate)}</div>
              {birth.note && <div style={styles.birthNote}>💬 {birth.note}</div>}
              <div style={styles.birthNote}>📆 {birth.mealDays || 14} Tage Essensversorgung geplant</div>
              <div style={styles.progressWrap}>
                <div style={styles.progressLabel}>
                  <span>Abendessen organisiert</span>
                  <span style={{ color: "#e8856a", fontWeight: 700 }}>{filled}/{days.length}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                </div>
              </div>
              <button style={styles.cardBtn}>Kalender öffnen →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DETAIL ────────────────────────────────────────────────────────
function DetailView({ birth, setView, setSelectedDay, toggleConfirm }) {
  const days = getDaysArray(birth.birthDate, birth.mealDays || 14);
  const filled = days.filter(d => birth.meals[d]).length;

  function openAddMeal(day) {
    setSelectedDay(day);
    setView("add-meal");
  }

  return (
    <div style={styles.pageWrap}>
      <button onClick={() => setView("list")} style={styles.backBtn}>← Zurück</button>
      <div style={styles.detailHeader}>
        <div style={styles.detailAvatar}>👶</div>
        <div>
          <h2 style={styles.pageTitle}>{birth.babyName}</h2>
          <div style={styles.parentName}>{birth.parentName}</div>
          <div style={styles.birthDate}>🗓 {formatDate(birth.birthDate)}</div>
          {birth.note && <div style={styles.birthNote}>💬 {birth.note}</div>}
          <div style={styles.birthNote}>📆 {birth.mealDays || 14} Tage Essensversorgung</div>
        </div>
      </div>

      <div style={styles.progressWrap}>
        <div style={styles.progressLabel}>
          <span style={{ fontWeight: 600 }}>Abendessen geplant</span>
          <span style={{ color: "#e8856a", fontWeight: 700 }}>{filled} von {days.length} Tagen</span>
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${Math.round(filled / days.length * 100)}%` }} />
        </div>
      </div>

      <h3 style={{ ...styles.sectionTitle, marginTop: 32 }}>{birth.mealDays || 14}-Tage Kalender</h3>
      <div style={styles.dayGrid}>
        {days.map((day, i) => {
          const meal = birth.meals[day];
          return (
            <div key={day} style={{ ...styles.dayCard, ...(meal ? styles.dayCardFilled : {}) }}>
              <div style={styles.dayNum}>Tag {i + 1}</div>
              <div style={styles.dayDate}>{formatDate(day).split(",")[0]}<br />{new Date(day).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</div>
              {meal ? (
                <>
                  <div style={styles.mealEmoji}>{meal.emoji}</div>
                  <div style={styles.mealDish}>{meal.dish}</div>
                  <div style={styles.mealPerson}>von {meal.name}</div>
                  <button
                    onClick={() => toggleConfirm(birth.id, day)}
                    style={{ ...styles.confirmBtn, background: meal.confirmed ? "#4CAF50" : "#f0e8e4" }}
                  >
                    {meal.confirmed ? "✓ Bestätigt" : "Bestätigen"}
                  </button>
                </>
              ) : (
                <>
                  <div style={styles.mealEmoji}>🫙</div>
                  <div style={styles.mealEmpty}>Noch frei</div>
                  <button onClick={() => openAddMeal(day)} style={styles.addMealBtn}>Ich bringe Essen</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ADD BIRTH ─────────────────────────────────────────────────────
function AddBirthView({ form, setForm, onSubmit, setView }) {
  return (
    <div style={styles.formWrap}>
      <button onClick={() => setView("list")} style={styles.backBtn}>← Zurück</button>
      <div style={styles.formCard}>
        <div style={{ fontSize: 48, textAlign: "center" }}>🍼</div>
        <h2 style={styles.formTitle}>Geburt eintragen</h2>
        <p style={styles.formSub}>Trag die Geburt ein, damit Freunde Essen bringen können.</p>
        <label style={styles.label}>Name des Babys *</label>
        <input style={styles.input} placeholder="z.B. Mia" value={form.babyName}
          onChange={e => setForm({ ...form, babyName: e.target.value })} />
        <label style={styles.label}>Eltern / Familie *</label>
        <input style={styles.input} placeholder="z.B. Familie Müller" value={form.parentName}
          onChange={e => setForm({ ...form, parentName: e.target.value })} />
        <label style={styles.label}>Geburtsdatum *</label>
        <input style={styles.input} type="date" value={form.birthDate}
          onChange={e => setForm({ ...form, birthDate: e.target.value })} />
        <label style={styles.label}>Für wie viele Tage wird Essen benötigt? *</label>
        <div style={styles.sliderWrap}>
          <input
            type="range" min={3} max={28} step={1}
            value={form.mealDays}
            onChange={e => setForm({ ...form, mealDays: Number(e.target.value) })}
            style={styles.slider}
          />
          <div style={styles.sliderLabels}>
            <span style={{ color: "#b89a8a" }}>3</span>
            <span style={styles.sliderValue}>{form.mealDays} Tage</span>
            <span style={{ color: "#b89a8a" }}>28</span>
          </div>
          <div style={styles.sliderPresets}>
            {[7, 10, 14, 21].map(d => (
              <button key={d} onClick={() => setForm({ ...form, mealDays: d })}
                style={{ ...styles.presetBtn, background: form.mealDays === d ? "#e8856a" : "#fde8df", color: form.mealDays === d ? "#fff" : "#e8856a" }}>
                {d} Tage
              </button>
            ))}
          </div>
        </div>
        <label style={styles.label}>Hinweise (Allergien, Ernährung …)</label>
        <textarea style={{ ...styles.input, height: 80, resize: "vertical" }}
          placeholder="z.B. vegetarisch, keine Nüsse"
          value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
        <button onClick={onSubmit} style={styles.heroBtnPrimary}>Eintragen 🎉</button>
      </div>
    </div>
  );
}

// ── ADD MEAL ──────────────────────────────────────────────────────
function AddMealView({ birth, day, form, setForm, onSubmit, setView, emojis }) {
  return (
    <div style={styles.formWrap}>
      <button onClick={() => setView("detail")} style={styles.backBtn}>← Zurück</button>
      <div style={styles.formCard}>
        <div style={{ fontSize: 48, textAlign: "center" }}>🍲</div>
        <h2 style={styles.formTitle}>Essen eintragen</h2>
        <p style={styles.formSub}>
          Du bringst Essen für <strong>{birth.parentName}</strong> am<br />
          <strong style={{ color: "#e8856a" }}>{formatDate(day)}</strong>
        </p>
        <label style={styles.label}>Dein Name *</label>
        <input style={styles.input} placeholder="z.B. Julia M." value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} />
        <label style={styles.label}>Was kochst du? *</label>
        <input style={styles.input} placeholder="z.B. Gemüsecurry mit Reis" value={form.dish}
          onChange={e => setForm({ ...form, dish: e.target.value })} />
        <label style={styles.label}>Emoji wählen</label>
        <div style={styles.emojiPicker}>
          {emojis.map(e => (
            <button key={e} onClick={() => setForm({ ...form, emoji: e })}
              style={{ ...styles.emojiBtn, background: form.emoji === e ? "#fde8df" : "transparent", transform: form.emoji === e ? "scale(1.3)" : "scale(1)" }}>
              {e}
            </button>
          ))}
        </div>
        <button onClick={onSubmit} style={styles.heroBtnPrimary}>Eintragen 🎉</button>
      </div>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "#fdf6f0",
    fontFamily: "'Georgia', 'Garamond', serif",
    position: "relative",
    overflow: "hidden",
  },
  bgBlob1: {
    position: "fixed", top: -120, right: -120, width: 400, height: 400,
    borderRadius: "50%", background: "radial-gradient(circle, #fde8df88 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bgBlob2: {
    position: "fixed", bottom: -100, left: -80, width: 350, height: 350,
    borderRadius: "50%", background: "radial-gradient(circle, #d4e8d888 0%, transparent 70%)",
    pointerEvents: "none",
  },
  toast: {
    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
    color: "#fff", padding: "12px 28px", borderRadius: 50, fontFamily: "sans-serif",
    fontSize: 14, fontWeight: 600, zIndex: 1000, boxShadow: "0 4px 20px #0002",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 32px", background: "#fff9f5",
    borderBottom: "1px solid #f0e0d6", position: "sticky", top: 0, zIndex: 100,
    boxShadow: "0 2px 12px #e8856a11",
  },
  logoBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 28 },
  logoText: { fontSize: 20, color: "#7a4a3a", letterSpacing: "-0.5px" },
  logoBold: { fontWeight: 900, color: "#e8856a" },
  nav: { display: "flex", gap: 12, alignItems: "center" },
  navBtn: {
    background: "none", border: "1px solid #e8856a", color: "#e8856a",
    borderRadius: 50, padding: "8px 20px", cursor: "pointer", fontFamily: "sans-serif", fontSize: 14,
  },
  navBtnPrimary: {
    background: "#e8856a", border: "none", color: "#fff",
    borderRadius: 50, padding: "8px 20px", cursor: "pointer", fontFamily: "sans-serif", fontSize: 14, fontWeight: 600,
  },
  main: { maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" },
  // HOME
  homeWrap: { textAlign: "center", paddingTop: 20 },
  heroBadge: {
    display: "inline-block", background: "#fde8df", color: "#c0604a",
    borderRadius: 50, padding: "6px 20px", fontSize: 13, fontFamily: "sans-serif",
    letterSpacing: 1, marginBottom: 24,
  },
  heroTitle: { fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#5a3028", lineHeight: 1.2, marginBottom: 16 },
  heroAccent: { color: "#e8856a" },
  heroSub: { fontSize: 17, color: "#9a6a5a", maxWidth: 540, margin: "0 auto 32px", lineHeight: 1.7, fontFamily: "sans-serif" },
  heroActions: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 },
  heroBtnPrimary: {
    background: "linear-gradient(135deg, #e8856a, #d4604a)", color: "#fff", border: "none",
    borderRadius: 50, padding: "14px 32px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: "sans-serif", boxShadow: "0 4px 16px #e8856a44",
  },
  heroBtnSecondary: {
    background: "#fff", color: "#e8856a", border: "2px solid #e8856a",
    borderRadius: 50, padding: "12px 28px", fontSize: 15, cursor: "pointer", fontFamily: "sans-serif",
  },
  statsRow: { display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 },
  statCard: {
    background: "#fff", borderRadius: 20, padding: "24px 32px", textAlign: "center",
    boxShadow: "0 4px 20px #e8856a11", minWidth: 140,
  },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statVal: { fontSize: 36, fontWeight: 900, color: "#e8856a" },
  statLabel: { fontSize: 13, color: "#9a7a6a", fontFamily: "sans-serif", marginTop: 4 },
  howSection: { background: "#fff", borderRadius: 24, padding: "40px 32px", boxShadow: "0 4px 24px #e8856a0a" },
  sectionTitle: { textAlign: "center", fontSize: 22, color: "#5a3028", marginBottom: 32 },
  stepsRow: { display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" },
  stepCard: {
    flex: "1 1 200px", maxWidth: 250, textAlign: "center",
    padding: "24px 16px", background: "#fdf6f0", borderRadius: 20,
  },
  stepNum: {
    width: 32, height: 32, background: "#e8856a", color: "#fff",
    borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontFamily: "sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12,
  },
  stepIcon: { fontSize: 36, marginBottom: 10 },
  stepTitle: { fontWeight: 700, color: "#5a3028", fontSize: 16, marginBottom: 8 },
  stepText: { fontSize: 13, color: "#9a7a6a", fontFamily: "sans-serif", lineHeight: 1.6 },
  // LIST
  pageWrap: { maxWidth: 900, margin: "0 auto" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  pageTitle: { fontSize: 28, color: "#5a3028", margin: 0 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 },
  birthCard: {
    background: "#fff", borderRadius: 24, padding: 24,
    boxShadow: "0 4px 20px #e8856a11", cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    border: "1px solid #f5e0d8",
  },
  birthCardTop: { display: "flex", alignItems: "center", gap: 14, marginBottom: 14 },
  babyAvatar: {
    width: 52, height: 52, background: "#fde8df", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0,
  },
  babyName: { fontSize: 20, fontWeight: 700, color: "#5a3028" },
  parentName: { fontSize: 14, color: "#9a7a6a", fontFamily: "sans-serif" },
  birthDate: { fontSize: 13, color: "#c08070", fontFamily: "sans-serif", marginBottom: 6 },
  birthNote: { fontSize: 13, color: "#7a9a7a", fontFamily: "sans-serif", marginBottom: 12, fontStyle: "italic" },
  progressWrap: { marginBottom: 16 },
  progressLabel: { display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: "sans-serif", color: "#9a7a6a", marginBottom: 6 },
  progressBar: { height: 8, background: "#f0e8e4", borderRadius: 10, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #e8856a, #d4604a)", borderRadius: 10, transition: "width 0.5s" },
  cardBtn: {
    background: "none", border: "none", color: "#e8856a",
    fontFamily: "sans-serif", fontSize: 14, cursor: "pointer", padding: 0, fontWeight: 600,
  },
  empty: { textAlign: "center", color: "#9a7a6a", padding: 60, fontFamily: "sans-serif", lineHeight: 2 },
  // DETAIL
  detailHeader: { display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap" },
  detailAvatar: {
    width: 72, height: 72, background: "#fde8df", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, flexShrink: 0,
  },
  dayGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 },
  dayCard: {
    background: "#fff", borderRadius: 18, padding: 16, border: "1px solid #f0e0d6",
    textAlign: "center", boxShadow: "0 2px 10px #e8856a08",
  },
  dayCardFilled: { border: "2px solid #e8856a", background: "#fff9f6" },
  dayNum: { fontSize: 11, fontFamily: "sans-serif", color: "#b89a8a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
  dayDate: { fontSize: 13, color: "#7a5a4a", fontFamily: "sans-serif", marginBottom: 10, lineHeight: 1.4 },
  mealEmoji: { fontSize: 30, marginBottom: 6 },
  mealDish: { fontSize: 13, color: "#5a3028", fontFamily: "sans-serif", fontWeight: 600, marginBottom: 4 },
  mealPerson: { fontSize: 12, color: "#9a7a6a", fontFamily: "sans-serif", marginBottom: 10 },
  mealEmpty: { fontSize: 13, color: "#b89a8a", fontFamily: "sans-serif", marginBottom: 10 },
  confirmBtn: {
    border: "none", borderRadius: 50, padding: "6px 14px", fontSize: 12,
    cursor: "pointer", fontFamily: "sans-serif", fontWeight: 600, color: "#fff",
    transition: "background 0.3s",
  },
  addMealBtn: {
    background: "#fde8df", border: "none", color: "#e8856a",
    borderRadius: 50, padding: "7px 14px", fontSize: 12, cursor: "pointer",
    fontFamily: "sans-serif", fontWeight: 600,
  },
  backBtn: {
    background: "none", border: "none", color: "#9a7a6a",
    fontSize: 14, cursor: "pointer", fontFamily: "sans-serif",
    marginBottom: 20, display: "block", padding: 0,
  },
  // FORM
  formWrap: { maxWidth: 520, margin: "0 auto" },
  formCard: {
    background: "#fff", borderRadius: 28, padding: 40,
    boxShadow: "0 8px 40px #e8856a11", display: "flex", flexDirection: "column", gap: 0,
  },
  formTitle: { textAlign: "center", color: "#5a3028", fontSize: 24, margin: "12px 0 4px" },
  formSub: { textAlign: "center", color: "#9a7a6a", fontFamily: "sans-serif", fontSize: 14, marginBottom: 24, lineHeight: 1.6 },
  label: { fontSize: 13, color: "#7a5a4a", fontFamily: "sans-serif", fontWeight: 600, marginTop: 12, marginBottom: 4, display: "block" },
  input: {
    width: "100%", boxSizing: "border-box", border: "1.5px solid #f0e0d6",
    borderRadius: 12, padding: "11px 14px", fontSize: 15, fontFamily: "sans-serif",
    color: "#5a3028", background: "#fdf6f0", outline: "none", marginBottom: 4,
  },
  emojiPicker: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, marginTop: 4 },
  emojiBtn: {
    fontSize: 22, border: "none", cursor: "pointer", padding: "4px 6px",
    borderRadius: 10, transition: "transform 0.2s, background 0.2s",
  },
  sliderWrap: { marginBottom: 4 },
  slider: { width: "100%", accentColor: "#e8856a", cursor: "pointer", marginBottom: 6 },
  sliderLabels: { display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "sans-serif", fontSize: 13, marginBottom: 10 },
  sliderValue: { fontWeight: 700, fontSize: 18, color: "#e8856a" },
  sliderPresets: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  presetBtn: {
    border: "none", borderRadius: 50, padding: "6px 16px", fontSize: 13,
    cursor: "pointer", fontFamily: "sans-serif", fontWeight: 600, transition: "background 0.2s, color 0.2s",
  },
};
