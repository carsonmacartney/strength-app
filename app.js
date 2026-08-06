(() => {
  "use strict";

  // ---------- Constants ----------

  const PROGRAM_STORAGE_KEY = "bigLiftin_program_v1";
  const DATA_STORAGE_KEY = "bigLiftin_v1";
  const UI_STATE_STORAGE_KEY = "shftrs_ui_state_v1";
  const LIBRARY_STORAGE_KEY = "shftrs_library_v1";
  const BODYWEIGHT_STORAGE_KEY = "shftrs_bodyweight_v1";
  const DEFAULT_TOTAL_WEEKS = 8;

  const MUSCLE_GROUPS = ["Chest", "Back", "Lats", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings", "Glutes", "Calves", "Core", "Other"];
  const COLOR_PALETTE = ["#E53935", "#1E88E5", "#43A047", "#8E24AA", "#F9A825", "#00ACC1", "#D81B60", "#6D4C41", "#5E35B1", "#00897B"];

  // Tin Shifters: shared PR board for the lift club, backed by Supabase. Anon key only -
  // RLS on the tin_shifters_prs table restricts inserts to the roster below and allows
  // no update/delete, so every submission is a permanent new row (honesty system, no login).
  const SUPABASE_URL = "https://rpskhrnbjsfeynnpsbdw.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2tocm5ianNmZXlubnBzYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NTYxMDgsImV4cCI6MjEwMTUzMjEwOH0.M9mdOB8eLcrkrBVXD0dkE0kjdi_wLsYzyU3n1tysbs8";

  const TIN_SHIFTERS_ROSTER = [
    "Carse", "Matt G", "Will G", "Brett", "Milts", "Adam", "Marek", "Marc",
    "Grub", "Dan", "Gravy", "Jacko", "Tommy B", "Dando", "Sam D",
  ];

  // Exercise definitions are code-only (not user-editable in-app) - update this list
  // here to add/change what the club tracks. Each field the submitter fills in is
  // fixed; there's no way for them to add custom fields.
  const TIN_SHIFTERS_EXERCISES = [
    {
      id: "bench_press",
      name: "Bench Press",
      fields: [
        { key: "weight", label: "Weight (kg)", type: "number", step: "0.5" },
        { key: "reps", label: "Reps", type: "number", step: "1" },
      ],
      sortValue: (v) => parseFloat(v.weight) || 0,
      formatEntry: (v) => `${v.weight}kg × ${v.reps}`,
    },
    {
      id: "max_chin_ups",
      name: "Max Chin Ups",
      fields: [
        { key: "reps", label: "Reps", type: "number", step: "1" },
      ],
      sortValue: (v) => parseFloat(v.reps) || 0,
      formatEntry: (v) => `${v.reps} reps`,
    },
  ];

  // Ported from the original hardcoded program. IDs match the original split/exercise
  // names so any history already logged under them keeps working. Everything here is
  // now editable in-app via Settings -> Modify Splits.
  const DEFAULT_PROGRAM = {
    splits: [
      {
        id: "Push", name: "Push", color: "#E53935",
        exercises: [
          { id: "Machine Press", name: "Machine Press", volume: "3x8-12", intensity: "1-2 RIR", cue: "Drive through full ROM", muscleGroup: "Chest" },
          { id: "Dips", name: "Dips", volume: "3xMax", intensity: "1-2 RIR", cue: "Lean forward for chest", muscleGroup: "Chest" },
          { id: "OHP", name: "OHP", volume: "3x8-12", intensity: "1-2 RIR", cue: "Brace core, no flare", muscleGroup: "Shoulders" },
          { id: "Chest Fly", name: "Chest Fly", volume: "3x12+", intensity: "1-2 RIR", cue: "Full stretch at bottom", muscleGroup: "Chest" },
          { id: "Tricep Pushdown", name: "Tricep Pushdown", volume: "3x12+", intensity: "1-2 RIR", cue: "Elbows pinned", muscleGroup: "Triceps" },
          { id: "Lateral Raise", name: "Lateral Raise", volume: "3x12+", intensity: "", cue: "Last set max out + halves", muscleGroup: "Shoulders" },
        ],
        addons: [],
      },
      {
        id: "Pull", name: "Pull", color: "#1E88E5",
        exercises: [
          { id: "Neutral Chins", name: "Neutral Chins", volume: "3xMax", intensity: "Max", cue: "Goal: 10 clean", muscleGroup: "Back" },
          { id: "Seated Row (Neutral)", name: "Seated Row (Neutral)", volume: "3x8-12", intensity: "1-2 RIR", cue: "Drive elbows back", muscleGroup: "Back" },
          { id: "T-Bar Row", name: "T-Bar Row", volume: "3x8-10", intensity: "1-2 RIR", cue: "Pronated grip", muscleGroup: "Back" },
          { id: "Kelso Shrug", name: "Kelso Shrug", volume: "3x12", intensity: "", cue: "No elbow bend", muscleGroup: "Back" },
          { id: "Rear Delt Fly", name: "Rear Delt Fly", volume: "2x12", intensity: "", cue: "Cable, controlled", muscleGroup: "Shoulders" },
          { id: "Machine Preacher (Pull)", name: "Machine Preacher", volume: "3x10", intensity: "", cue: "Slow eccentric", muscleGroup: "Biceps" },
          { id: "Hammer Curl", name: "Hammer Curl", volume: "3x10", intensity: "", cue: "", muscleGroup: "Biceps" },
        ],
        addons: ["Grip Work"],
      },
      {
        id: "Legs", name: "Legs", color: "#43A047",
        exercises: [
          { id: "GHD Raise", name: "GHD Raise", volume: "3x10", intensity: "", cue: "Control the eccentric", muscleGroup: "Hamstrings" },
          { id: "Back Squat", name: "Back Squat", volume: "3x8-10", intensity: "1-2 RIR", cue: "Knees out, brace", muscleGroup: "Quads" },
          { id: "Split Squat", name: "Split Squat", volume: "3x10", intensity: "1-2 RIR", cue: "Rear foot elevated", muscleGroup: "Quads" },
          { id: "Leg Extension", name: "Leg Extension", volume: "3x10", intensity: "Max last", cue: "Max out final set", muscleGroup: "Quads" },
          { id: "Hamstring Curl", name: "Hamstring Curl", volume: "3x10", intensity: "", cue: "", muscleGroup: "Hamstrings" },
        ],
        addons: ["Core Work"],
      },
      {
        id: "Upper+Arms", name: "Upper+Arms", color: "#8E24AA",
        exercises: [
          { id: "Machine Chest Press", name: "Machine Chest Press", volume: "3x8-12", intensity: "RPE 6-8", cue: "Additional chest volume", muscleGroup: "Chest" },
          { id: "Seated Row", name: "Seated Row", volume: "3x8-12", intensity: "RPE 6-8", cue: "Additional back volume", muscleGroup: "Back" },
          { id: "Cable Overhead Extension", name: "Cable Overhead Extension", volume: "3x12", intensity: "1-2 RIR", cue: "Long head, monitor elbow", muscleGroup: "Triceps" },
          { id: "Rope Pushdown", name: "Rope Pushdown", volume: "3x12+", intensity: "1-2 RIR", cue: "Elbows pinned", muscleGroup: "Triceps" },
          { id: "Machine Preacher (Upper)", name: "Machine Preacher", volume: "3x10", intensity: "1-2 RIR", cue: "Peak contraction", muscleGroup: "Biceps" },
          { id: "Incline DB Curl", name: "Incline DB Curl", volume: "3x10", intensity: "1-2 RIR", cue: "Long head stretch", muscleGroup: "Biceps" },
          { id: "Lateral Raise (Upper)", name: "Lateral Raise", volume: "3x12+", intensity: "", cue: "2x delt frequency", muscleGroup: "Shoulders" },
        ],
        addons: [],
      },
    ],
    templates: [],
  };

  // ---------- Storage ----------

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadProgram() {
    try {
      const raw = localStorage.getItem(PROGRAM_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.templates) parsed.templates = [];
        return parsed;
      }
    } catch {}
    return JSON.parse(JSON.stringify(DEFAULT_PROGRAM));
  }

  function saveProgram() {
    try { localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(program)); } catch {}
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(DATA_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveData() {
    try { localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(allData)); } catch {}
  }

  function loadUiState() {
    try {
      const raw = localStorage.getItem(UI_STATE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveUiState() {
    try {
      localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify({ activeDay: state.activeDay, activeWeek: state.activeWeek }));
    } catch {}
  }

  function loadLibrary() {
    try {
      const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveLibrary() {
    try { localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library)); } catch {}
  }

  function loadBodyweight() {
    try {
      const raw = localStorage.getItem(BODYWEIGHT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveBodyweight() {
    try { localStorage.setItem(BODYWEIGHT_STORAGE_KEY, JSON.stringify(bodyweightEntries)); } catch {}
  }

  // Superseded by the split/week model; drop the old freeform-logging data.
  localStorage.removeItem("strength_exercises");
  localStorage.removeItem("strength_sessions");
  // Feedback feature removed - not used, drop any leftover data.
  localStorage.removeItem("shftrs_feedback_v1");

  let program = loadProgram();
  let allData = loadData();
  if (!allData._totalWeeks) allData._totalWeeks = DEFAULT_TOTAL_WEEKS;
  let library = loadLibrary();
  let bodyweightEntries = loadBodyweight();

  // One-time migration: fold any previously-named "spare slot" exercises (from the
  // earlier version of this app) into the editable exercise list so they aren't lost.
  (function migrateSpareNames() {
    let changed = false;
    program.splits.forEach((split) => {
      const dayData = allData[split.id];
      if (!dayData || !dayData._spareNames) return;
      Object.entries(dayData._spareNames).forEach(([spareKey, name]) => {
        if (!name || !name.trim()) return;
        if (split.exercises.some((e) => e.id === spareKey)) return;
        split.exercises.push({ id: spareKey, name: name.trim(), volume: "", intensity: "", cue: "", muscleGroup: "" });
        changed = true;
      });
      delete dayData._spareNames;
    });
    if (changed) saveProgram();
  })();

  // One-time migration: build the shared exercise library from whatever exercises
  // already exist across splits (and any historical adhoc entries), so nothing is
  // lost and everything becomes pickable/reusable going forward. Also reassigns
  // obvious lat-dominant movements from "Back" to the new "Lats" group.
  if (!library) {
    library = [];
    const seen = new Set();
    program.splits.forEach((split) => {
      split.exercises.forEach((ex) => {
        if (seen.has(ex.id)) return;
        seen.add(ex.id);
        let muscleGroup = ex.muscleGroup || "";
        if (muscleGroup === "Back" && /neutral chins|chin-?up|pull-?up|lat pulldown/i.test(ex.name)) {
          muscleGroup = "Lats";
        }
        library.push({ id: ex.id, name: ex.name, muscleGroup });
      });
    });
    Object.keys(allData).forEach((splitId) => {
      if (splitId.startsWith("_")) return;
      const dayData = allData[splitId];
      Object.keys(dayData).forEach((weekKey) => {
        if (weekKey.startsWith("_")) return;
        const adhoc = dayData[weekKey]._adhoc;
        if (!adhoc) return;
        adhoc.forEach((a) => {
          if (seen.has(a.id)) return;
          seen.add(a.id);
          library.push({ id: a.id, name: a.name, muscleGroup: "" });
        });
      });
    });
    saveLibrary();
    program.splits.forEach((split) => {
      split.exercises.forEach((ex) => {
        const lib = library.find((l) => l.id === ex.id);
        if (lib && lib.muscleGroup === "Lats" && ex.muscleGroup !== "Lats") ex.muscleGroup = "Lats";
      });
    });
    saveProgram();
  }

  // ---------- Helpers ----------

  function findSplit(id) { return program.splits.find((s) => s.id === id); }
  function findExercise(splitId, exId) {
    const split = findSplit(splitId);
    return split ? split.exercises.find((e) => e.id === exId) : null;
  }
  function findLibraryExercise(exId) { return library.find((e) => e.id === exId); }

  function updateLibraryExercise(exId, updates) {
    let lib = findLibraryExercise(exId);
    if (!lib) {
      lib = { id: exId, name: updates.name || "Exercise", muscleGroup: updates.muscleGroup || "" };
      library.push(lib);
    } else {
      if (updates.name !== undefined) lib.name = updates.name;
      if (updates.muscleGroup !== undefined) lib.muscleGroup = updates.muscleGroup;
    }
    saveLibrary();
    program.splits.forEach((split) => {
      split.exercises.forEach((ex) => {
        if (ex.id === exId) {
          if (updates.name !== undefined) ex.name = lib.name;
          if (updates.muscleGroup !== undefined) ex.muscleGroup = lib.muscleGroup;
        }
      });
    });
    saveProgram();
  }

  function splitsUsingExercise(exId) {
    const ids = new Set();
    program.splits.forEach((split) => {
      if (split.exercises.some((e) => e.id === exId)) ids.add(split.id);
    });
    Object.keys(allData).forEach((splitId) => {
      if (splitId.startsWith("_") || !findSplit(splitId)) return;
      const dayData = allData[splitId];
      Object.keys(dayData).forEach((weekKey) => {
        if (weekKey.startsWith("_")) return;
        const adhoc = dayData[weekKey]._adhoc;
        if (adhoc && adhoc.some((a) => a.id === exId)) ids.add(splitId);
      });
    });
    return [...ids];
  }

  // Merge a duplicate library exercise into the canonical one it should have always
  // been: repoints any split reference, migrates logged history to the kept id, and
  // drops the duplicate. Safe to call repeatedly - no-ops once already merged.
  function mergeLibraryExercises(keepId, mergeId) {
    if (keepId === mergeId) return;
    if (!library.find((e) => e.id === mergeId)) return;

    program.splits.forEach((split) => {
      const idx = split.exercises.findIndex((e) => e.id === mergeId);
      if (idx === -1) return;
      if (split.exercises.some((e) => e.id === keepId)) {
        split.exercises.splice(idx, 1);
      } else {
        split.exercises[idx].id = keepId;
        const lib = findLibraryExercise(keepId);
        if (lib) {
          split.exercises[idx].name = lib.name;
          split.exercises[idx].muscleGroup = lib.muscleGroup;
        }
      }
    });

    Object.keys(allData).forEach((splitId) => {
      if (splitId.startsWith("_")) return;
      const dayData = allData[splitId];
      Object.keys(dayData).forEach((weekKey) => {
        if (weekKey.startsWith("_")) return;
        const weekData = dayData[weekKey];
        if (weekData[mergeId] && weekData[keepId]) {
          weekData[keepId].sets = (weekData[keepId].sets || []).concat(weekData[mergeId].sets || []);
          delete weekData[mergeId];
        } else if (weekData[mergeId]) {
          weekData[keepId] = weekData[mergeId];
          delete weekData[mergeId];
        }
        if (weekData._adhoc) {
          weekData._adhoc.forEach((a) => { if (a.id === mergeId) a.id = keepId; });
        }
      });
    });

    library = library.filter((e) => e.id !== mergeId);
    saveLibrary();
    saveProgram();
    saveData();
  }

  mergeLibraryExercises("Machine Preacher (Pull)", "Machine Preacher (Upper)");
  mergeLibraryExercises("Lateral Raise", "Lateral Raise (Upper)");
  function accentFor(splitId) { const s = findSplit(splitId); return s ? s.color : "#888"; }
  function allTabs() { return [...program.splits.map((s) => s.id), "Stats", "Settings"]; }

  function weekLabel(n) { return `Week ${n}`; }
  function weekNum(key) { return parseInt(key.replace("Week ", ""), 10); }

  function bestSet(sets) {
    if (!sets || sets.length === 0) return null;
    return sets.reduce((best, s) => {
      const w = parseFloat(s.weight) || 0;
      const bw = parseFloat(best.weight) || 0;
      if (w !== bw) return w > bw ? s : best;
      const r = parseInt(s.reps, 10) || 0;
      const br = parseInt(best.reps, 10) || 0;
      return r > br ? s : best;
    }, sets[0]);
  }

  function totalVol(sets) {
    if (!sets || sets.length === 0) return 0;
    return sets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0), 0);
  }

  function workingSets(sets) {
    return (sets || []).filter((s) => !s.warmup);
  }

  function estimate1RM(weight, reps) {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10) || 0;
    if (w <= 0 || r <= 0) return 0;
    if (r === 1) return w;
    return w * (1 + r / 30);
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function parseISO(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const MONTH_SHORT_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatDateShort(iso) {
    const d = parseISO(iso);
    return `${d.getDate()} ${MONTH_SHORT_NAMES[d.getMonth()]}`;
  }

  function formatDateNumeric(iso) {
    const d = parseISO(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  function currentWeekStartISO() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  }

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), 1800);
  }

  function ensurePath(splitId, weekKey) {
    if (!allData[splitId]) allData[splitId] = {};
    if (!allData[splitId][weekKey]) allData[splitId][weekKey] = {};
  }

  // ---------- App state ----------

  const savedUiState = loadUiState();
  const restoredDayValid = savedUiState.activeDay &&
    (savedUiState.activeDay === "Stats" || savedUiState.activeDay === "Settings" || findSplit(savedUiState.activeDay));

  const state = {
    activeDay: restoredDayValid ? savedUiState.activeDay : (program.splits[0] ? program.splits[0].id : "Settings"),
    activeWeek: (typeof savedUiState.activeWeek === "number" && savedUiState.activeWeek >= 1) ? savedUiState.activeWeek : 1,
    showWeekPicker: false,
  };

  const expandedSplits = new Set();
  const showingAddExercisePicker = new Set();
  let openCardPersisters = [];
  function flushOpenCards() {
    openCardPersisters.forEach((fn) => { try { fn(); } catch {} });
    openCardPersisters = [];
  }

  const tabbarEl = document.getElementById("tabbar");
  const weekbarEl = document.getElementById("weekbar");
  const weekPickerEl = document.getElementById("week-picker");
  const viewContainerEl = document.getElementById("view-container");
  const progressionViewEl = document.getElementById("progression-view");
  const splitsEditorEl = document.getElementById("splits-editor-view");

  // ---------- Tab bar ----------

  function renderTabBar() {
    tabbarEl.innerHTML = "";
    allTabs().forEach((dk) => {
      const isSpecial = dk === "Settings" || dk === "Stats";
      const split = isSpecial ? null : findSplit(dk);
      const color = isSpecial ? "#888" : (split ? split.color : "#888");
      const label = dk === "Settings" ? "⚙" : (dk === "Stats" ? "Stats" : (split ? split.name : dk));
      const isActive = state.activeDay === dk;
      const btn = el("button", "tab-pill" + (isActive ? " active" : ""), label);
      btn.style.color = isActive ? color : "";
      if (isActive) btn.style.borderBottomColor = color;
      btn.addEventListener("click", () => {
        flushOpenCards();
        state.activeDay = dk;
        state.showWeekPicker = false;
        if (dk === "Stats") { statsWeekView = null; statsWeekPickerOpen = false; }
        saveUiState();
        renderTabBar();
        renderWeekBar();
        renderWeekPicker();
        renderMainView();
      });
      tabbarEl.appendChild(btn);
    });
  }

  // ---------- Week bar ----------

  function renderWeekBar() {
    const isSplit = !!findSplit(state.activeDay);
    weekbarEl.classList.toggle("hidden", !isSplit);
    if (!isSplit) return;

    weekbarEl.innerHTML = "";
    const accent = accentFor(state.activeDay);
    const totalWeeks = allData._totalWeeks || DEFAULT_TOTAL_WEEKS;
    const wk = weekLabel(state.activeWeek);
    const isDeload = !!(allData._deloadWeeks && allData._deloadWeeks[wk]);

    const prevBtn = el("button", "week-nav-btn", "‹");
    prevBtn.disabled = state.activeWeek === 1;
    prevBtn.addEventListener("click", () => {
      flushOpenCards();
      state.activeWeek = Math.max(1, state.activeWeek - 1);
      state.showWeekPicker = false;
      saveUiState();
      renderWeekBar();
      renderWeekPicker();
      renderMainView();
    });

    const centerBtn = el("button", "week-center-btn");
    const labelRow = el("div", "week-label-row");
    labelRow.appendChild(el("span", "week-label", `Week ${state.activeWeek}`));
    if (isDeload) labelRow.appendChild(el("span", "deload-badge", "DELOAD"));
    centerBtn.appendChild(labelRow);
    centerBtn.appendChild(el("div", "week-hint", "tap to jump"));
    centerBtn.addEventListener("click", () => {
      state.showWeekPicker = !state.showWeekPicker;
      renderWeekPicker();
    });

    const atCap = state.activeWeek === totalWeeks;
    const nextBtn = el("button", "week-nav-btn" + (atCap ? " add-week" : ""), atCap ? "+" : "›");
    nextBtn.style.color = atCap ? accent : "";
    nextBtn.addEventListener("click", () => {
      flushOpenCards();
      if (atCap) {
        allData._totalWeeks = totalWeeks + 1;
        saveData();
        state.activeWeek = allData._totalWeeks;
      } else {
        state.activeWeek = Math.min(totalWeeks, state.activeWeek + 1);
      }
      state.showWeekPicker = false;
      saveUiState();
      renderWeekBar();
      renderWeekPicker();
      renderMainView();
    });

    weekbarEl.appendChild(prevBtn);
    weekbarEl.appendChild(centerBtn);
    weekbarEl.appendChild(nextBtn);
  }

  function renderWeekPicker() {
    const isSplit = !!findSplit(state.activeDay);
    weekPickerEl.classList.toggle("hidden", !isSplit || !state.showWeekPicker);
    if (!isSplit || !state.showWeekPicker) { weekPickerEl.innerHTML = ""; return; }

    weekPickerEl.innerHTML = "";
    const accent = accentFor(state.activeDay);
    const totalWeeks = allData._totalWeeks || DEFAULT_TOTAL_WEEKS;

    for (let w = 1; w <= totalWeeks; w++) {
      const isActive = state.activeWeek === w;
      const btn = el("button", "week-btn" + (isActive ? " active" : ""), `W${w}`);
      if (isActive) { btn.style.background = accent; }
      const isDeloadW = !!(allData._deloadWeeks && allData._deloadWeeks[weekLabel(w)]);
      if (isDeloadW) btn.appendChild(el("span", "deload-dot"));
      btn.addEventListener("click", () => {
        flushOpenCards();
        state.activeWeek = w;
        state.showWeekPicker = false;
        saveUiState();
        renderWeekBar();
        renderWeekPicker();
        renderMainView();
      });
      weekPickerEl.appendChild(btn);
    }

    const addBtn = el("button", "week-btn add-week-btn", "+ Add");
    addBtn.addEventListener("click", () => {
      flushOpenCards();
      allData._totalWeeks = totalWeeks + 1;
      saveData();
      state.activeWeek = allData._totalWeeks;
      state.showWeekPicker = false;
      saveUiState();
      renderWeekBar();
      renderWeekPicker();
      renderMainView();
    });
    weekPickerEl.appendChild(addBtn);

    const footer = el("div", "week-picker-footer");
    const row = el("div", "deload-toggle-row");
    const wk = weekLabel(state.activeWeek);
    const isDeload = !!(allData._deloadWeeks && allData._deloadWeeks[wk]);
    const sw = el("div", "deload-switch" + (isDeload ? " on" : ""));
    sw.appendChild(el("div", "deload-switch-knob"));
    sw.addEventListener("click", () => {
      if (!allData._deloadWeeks) allData._deloadWeeks = {};
      allData._deloadWeeks[wk] = !allData._deloadWeeks[wk];
      saveData();
      renderWeekBar();
      renderWeekPicker();
    });
    row.appendChild(sw);
    row.appendChild(el("span", "deload-toggle-label" + (isDeload ? " on" : ""), "Deload week"));
    footer.appendChild(row);
    weekPickerEl.appendChild(footer);
  }

  // ---------- Main view dispatch ----------

  function renderMainView() {
    viewContainerEl.innerHTML = "";
    if (state.activeDay === "Settings") {
      viewContainerEl.appendChild(buildSettingsView());
    } else if (state.activeDay === "Stats") {
      viewContainerEl.appendChild(buildStatsView());
    } else if (findSplit(state.activeDay)) {
      viewContainerEl.appendChild(buildSplitView(state.activeDay));
    } else {
      viewContainerEl.appendChild(el("div", "empty-msg", "No splits yet. Add one in Settings → Modify Splits."));
    }
  }

  // ---------- Split view (exercise list) ----------

  function buildSplitView(splitId) {
    const wrap = el("div");
    const split = findSplit(splitId);
    const accent = split.color;
    const weekKey = weekLabel(state.activeWeek);

    const list = el("div", "reorder-list");
    list.style.setProperty("--accent-color", accent);

    const order = getDisplayOrder(splitId, weekKey);

    if (order.length === 0) {
      list.appendChild(el("div", "empty-msg", "No exercises yet. Add some below or in Settings → Modify Splits."));
    }

    order.forEach((exId) => {
      const ex = resolveExerciseForWeek(splitId, weekKey, exId);
      if (!ex) return;
      const isAdhoc = !findExercise(splitId, exId);
      const itemWrap = el("div", "exercise-item");
      itemWrap.dataset.exId = exId;
      const cardEl = buildExerciseCard(splitId, ex, weekKey, accent, isAdhoc);
      itemWrap.appendChild(cardEl);
      itemWrap.appendChild(buildProgressionLink(splitId, exId));
      list.appendChild(itemWrap);
      cardEl.dragHandle.addEventListener("pointerdown", (e) => startDrag(e, itemWrap, list, splitId, weekKey));
    });
    wrap.appendChild(list);

    wrap.appendChild(buildQuickAddExercise(splitId, weekKey, accent));

    if (split.addons.length > 0) {
      const addonsWrap = el("div");
      addonsWrap.appendChild(el("div", "addons-title", "ADD-ONS"));
      split.addons.forEach((a) => addonsWrap.appendChild(el("div", "addon-item", a)));
      wrap.appendChild(addonsWrap);
    }

    const notesWrap = el("div", "session-notes-wrap");
    notesWrap.appendChild(el("div", "session-notes-title", "SESSION NOTES"));
    const textarea = el("textarea", "notes-textarea");
    textarea.placeholder = "How did it feel? Any flags...";
    textarea.rows = 3;
    textarea.value = (allData[splitId] && allData[splitId][weekKey] && allData[splitId][weekKey]._sessionNote) || "";
    textarea.addEventListener("blur", () => {
      ensurePath(splitId, weekKey);
      allData[splitId][weekKey]._sessionNote = textarea.value;
      saveData();
    });
    notesWrap.appendChild(textarea);
    wrap.appendChild(notesWrap);

    return wrap;
  }

  function buildProgressionLink(splitId, exId) {
    const link = el("div", "progression-link", "view progression →");
    link.addEventListener("click", () => openProgression(splitId, exId));
    return link;
  }

  // ---------- Drag reorder (this week's display order only) ----------

  let dragState = null;

  function startDrag(e, itemEl, listEl, splitId, weekKey) {
    e.preventDefault();
    const indicator = el("div", "drop-indicator");
    dragState = { itemEl, listEl, splitId, weekKey, startY: e.clientY, indicator };
    itemEl.classList.add("dragging");
    document.addEventListener("pointermove", onDragMove);
    document.addEventListener("pointerup", onDragEnd);
  }

  function dragSiblings() {
    return [...dragState.listEl.children].filter(
      (c) => c.classList.contains("exercise-item") && c !== dragState.itemEl
    );
  }

  function onDragMove(e) {
    if (!dragState) return;
    const dy = e.clientY - dragState.startY;
    dragState.itemEl.style.transform = `translateY(${dy}px)`;

    const siblings = dragSiblings();
    let targetIndex = siblings.length;
    for (let i = 0; i < siblings.length; i++) {
      const rect = siblings[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) { targetIndex = i; break; }
    }
    if (targetIndex >= siblings.length) {
      dragState.listEl.appendChild(dragState.indicator);
    } else {
      dragState.listEl.insertBefore(dragState.indicator, siblings[targetIndex]);
    }
  }

  function onDragEnd() {
    if (!dragState) return;
    document.removeEventListener("pointermove", onDragMove);
    document.removeEventListener("pointerup", onDragEnd);

    const { itemEl, listEl, splitId, weekKey, indicator } = dragState;
    itemEl.style.transform = "";
    itemEl.classList.remove("dragging");
    if (indicator.parentNode) {
      listEl.insertBefore(itemEl, indicator);
      indicator.remove();
    }

    const newOrder = [...listEl.children]
      .filter((c) => c.classList.contains("exercise-item"))
      .map((c) => c.dataset.exId);
    ensurePath(splitId, weekKey);
    allData[splitId][weekKey]._order = newOrder;
    saveData();
    dragState = null;
  }

  // ---------- Shared exercise picker (pick existing from library, or create new) ----------

  function buildExercisePicker(opts) {
    const wrap = el("div", "picker-wrap");

    const searchInput = el("input", "editor-field picker-search");
    searchInput.placeholder = "Search or type new exercise name…";
    wrap.appendChild(searchInput);

    const listEl = el("div", "picker-list");
    wrap.appendChild(listEl);

    const newRow = el("div", "picker-create-row hidden");
    wrap.appendChild(newRow);

    function renderList() {
      const query = searchInput.value.trim().toLowerCase();
      listEl.innerHTML = "";
      const excludeSet = new Set(opts.excludeIds || []);
      const matches = library
        .filter((ex) => !excludeSet.has(ex.id))
        .filter((ex) => !query || ex.name.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (matches.length === 0) {
        listEl.appendChild(el("div", "picker-empty", query ? "No matches" : "No saved exercises yet"));
      }
      matches.forEach((ex) => {
        const row = el("div", "picker-row");
        row.appendChild(el("span", "picker-row-name", ex.name));
        if (ex.muscleGroup) row.appendChild(el("span", "picker-row-tag", ex.muscleGroup));
        row.addEventListener("click", () => opts.onSelectExisting(ex.id));
        listEl.appendChild(row);
      });

      newRow.innerHTML = "";
      const exactMatch = library.some((ex) => ex.name.toLowerCase() === query);
      if (query && !exactMatch) {
        newRow.classList.remove("hidden");
        const createBtn = el("div", "picker-create-btn");
        createBtn.appendChild(el("span", "plus", "+"));
        createBtn.appendChild(el("span", null, `Create "${searchInput.value.trim()}"`));
        const mgSelect = el("select", "editor-muscle-select");
        const blankOpt = el("option", null, "Muscle group (optional)…");
        blankOpt.value = "";
        mgSelect.appendChild(blankOpt);
        MUSCLE_GROUPS.forEach((mg) => {
          const opt = el("option", null, mg);
          opt.value = mg;
          mgSelect.appendChild(opt);
        });
        createBtn.addEventListener("click", () => opts.onCreateNew(searchInput.value.trim(), mgSelect.value));
        newRow.appendChild(createBtn);
        newRow.appendChild(mgSelect);
      } else {
        newRow.classList.add("hidden");
      }
    }

    searchInput.addEventListener("input", renderList);
    renderList();
    setTimeout(() => searchInput.focus(), 0);

    return wrap;
  }

  // ---------- Quick add exercise (adhoc or permanent) ----------

  function buildQuickAddExercise(splitId, weekKey, accent) {
    const wrap = el("div", "quickadd-wrap");

    function showPrompt() {
      wrap.innerHTML = "";
      const prompt = el("div", "quickadd-prompt");
      prompt.appendChild(el("span", "plus", "+"));
      prompt.appendChild(el("span", null, "Add exercise"));
      prompt.addEventListener("click", showForm);
      wrap.appendChild(prompt);
    }

    function showForm() {
      wrap.innerHTML = "";
      const formCard = el("div", "quickadd-form");

      const split = findSplit(splitId);
      const weekData = allData[splitId] && allData[splitId][weekKey];
      const existingIds = [
        ...split.exercises.map((e) => e.id),
        ...((weekData && weekData._adhoc) ? weekData._adhoc.map((a) => a.id) : []),
      ];

      const checkRow = el("label", "quickadd-check-row");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "quickadd-checkbox";
      checkRow.appendChild(checkbox);
      checkRow.appendChild(document.createTextNode("Keep in program (adds to every future week)"));
      formCard.appendChild(checkRow);

      function addExisting(libId) {
        const lib = findLibraryExercise(libId);
        if (checkbox.checked) {
          split.exercises.push({ id: libId, name: lib.name, volume: "", intensity: "", cue: "", muscleGroup: lib.muscleGroup || "", startWeek: weekNum(weekKey) });
          saveProgram();
          toast(`Added ${lib.name} to the program from ${weekKey}`);
        } else {
          ensurePath(splitId, weekKey);
          if (!allData[splitId][weekKey]._adhoc) allData[splitId][weekKey]._adhoc = [];
          allData[splitId][weekKey]._adhoc.push({ id: libId, name: lib.name });
          saveData();
          toast(`Added ${lib.name} for this week`);
        }
        renderMainView();
      }

      function addNew(name, muscleGroup) {
        const id = uid();
        library.push({ id, name, muscleGroup });
        saveLibrary();
        addExisting(id);
      }

      const picker = buildExercisePicker({ excludeIds: existingIds, onSelectExisting: addExisting, onCreateNew: addNew });
      formCard.appendChild(picker);

      const btnRow = el("div", "quickadd-btn-row");
      const cancelBtn = el("button", "template-btn", "Cancel");
      cancelBtn.addEventListener("click", showPrompt);
      btnRow.appendChild(cancelBtn);
      formCard.appendChild(btnRow);
      wrap.appendChild(formCard);
    }

    showPrompt();
    return wrap;
  }

  // ---------- Set row builder ----------

  function buildSetRow(set, accent) {
    const row = el("div", "set-row");

    const weightInput = el("input", "set-input-weight");
    weightInput.type = "number";
    weightInput.placeholder = "kg";
    weightInput.value = set.weight || "";

    const timesSpan = el("span", "set-times", "×");

    const repsInput = el("input", "set-input-reps");
    repsInput.type = "number";
    repsInput.placeholder = "reps";
    repsInput.value = set.reps || "";

    const rpeInput = el("input", "set-input-rpe" + (set.rpe ? " filled" : ""));
    rpeInput.type = "number";
    rpeInput.placeholder = "RPE";
    rpeInput.min = "1"; rpeInput.max = "10"; rpeInput.step = "0.5";
    rpeInput.value = set.rpe || "";
    rpeInput.style.borderColor = set.rpe ? accent + "55" : "";
    rpeInput.addEventListener("input", () => {
      rpeInput.classList.toggle("filled", !!rpeInput.value);
      rpeInput.style.borderColor = rpeInput.value ? accent + "55" : "";
    });

    const warmupBtn = el("button", "set-warmup-toggle" + (set.warmup ? " active" : ""), "W");
    warmupBtn.type = "button";
    warmupBtn.title = "Mark as warm-up";
    warmupBtn.addEventListener("click", () => warmupBtn.classList.toggle("active"));

    const removeBtn = el("button", "set-remove-btn", "×");
    removeBtn.type = "button";
    removeBtn.addEventListener("click", () => row.remove());

    row.appendChild(weightInput);
    row.appendChild(timesSpan);
    row.appendChild(repsInput);
    row.appendChild(rpeInput);
    row.appendChild(warmupBtn);
    row.appendChild(removeBtn);
    return row;
  }

  function readSetsFromContainer(container) {
    const rows = [...container.querySelectorAll(".set-row")];
    return rows
      .map((row) => ({
        weight: row.querySelector(".set-input-weight").value,
        reps: row.querySelector(".set-input-reps").value,
        rpe: row.querySelector(".set-input-rpe").value,
        warmup: row.querySelector(".set-warmup-toggle").classList.contains("active"),
      }))
      .filter((s) => s.weight !== "" || s.reps !== "");
  }

  // ---------- Exercise card ----------

  function buildExerciseCard(splitId, exDef, weekKey, accent, isAdhoc) {
    const card = el("div", "exercise-card");
    const header = el("div", "exercise-card-header");
    const body = el("div", "exercise-card-body hidden");
    let open = false;
    let setsContainer = null;
    let notesInput = null;

    const dragHandle = el("div", "drag-handle", "⋮⋮");
    dragHandle.addEventListener("click", (e) => e.stopPropagation());
    card.dragHandle = dragHandle;

    function saved() {
      return allData[splitId] && allData[splitId][weekKey] && allData[splitId][weekKey][exDef.id];
    }

    function computePrevBest() {
      const wn = weekNum(weekKey);
      if (wn <= 1) return null;
      const prevKey = weekLabel(wn - 1);
      const relevantSplits = splitsUsingExercise(exDef.id);
      let combinedSets = [];
      const notes = [];
      relevantSplits.forEach((sId) => {
        const d = allData[sId] && allData[sId][prevKey] && allData[sId][prevKey][exDef.id];
        if (d && d.sets && d.sets.length > 0) {
          combinedSets = combinedSets.concat(d.sets);
          if (d.note) notes.push(d.note);
        }
      });
      if (combinedSets.length === 0) return null;
      const working = workingSets(combinedSets);
      return { data: { sets: combinedSets, note: notes.join(" · ") }, best: working.length ? bestSet(working) : null };
    }

    function computeIsPR(currentSets) {
      const currentBest = bestSet(workingSets(currentSets));
      if (!currentBest) return false;
      const relevantSplits = splitsUsingExercise(exDef.id);
      let allOtherSets = [];
      relevantSplits.forEach((sId) => {
        Object.entries(allData[sId] || {})
          .filter(([k]) => !(sId === splitId && k === weekKey) && !k.startsWith("_"))
          .forEach(([, wk]) => {
            if (wk[exDef.id] && wk[exDef.id].sets) allOtherSets = allOtherSets.concat(workingSets(wk[exDef.id].sets));
          });
      });
      if (allOtherSets.length === 0) return false;
      const currentWeight = parseFloat(currentBest.weight) || 0;
      const maxOtherWeight = Math.max(...allOtherSets.map((s) => parseFloat(s.weight) || 0));
      return currentWeight > maxOtherWeight;
    }

    function persistIfOpen() {
      if (!setsContainer) return;
      const clean = readSetsFromContainer(setsContainer);
      ensurePath(splitId, weekKey);
      allData[splitId][weekKey][exDef.id] = { sets: clean, note: notesInput ? notesInput.value : "", date: todayISO() };
      saveData();
    }

    function renderHeader() {
      header.innerHTML = "";
      header.classList.toggle("open", open);
      header.appendChild(dragHandle);

      const top = el("div", "exercise-card-top");
      const left = el("div");
      left.style.flex = "1";

      const nameRow = el("div", "exercise-name-row");
      nameRow.appendChild(el("span", "exercise-name", exDef.name));

      const s = saved();
      const currentSets = (s && s.sets) || [];
      if (computeIsPR(currentSets)) {
        const pr = el("span", "pr-badge", "PR");
        pr.style.background = accent;
        nameRow.appendChild(pr);
      }
      if (isAdhoc) nameRow.appendChild(el("span", "adhoc-tag", "this week only"));
      left.appendChild(nameRow);

      const meta = el("div", "exercise-meta");
      if (exDef.volume) { const v = el("span", "vol", exDef.volume); v.style.color = accent; meta.appendChild(v); }
      if (exDef.intensity) meta.appendChild(el("span", "intensity", exDef.intensity));
      if (exDef.cue) meta.appendChild(el("span", "cue", exDef.cue));
      left.appendChild(meta);

      const prev = computePrevBest();
      if (prev && prev.best && !open) {
        const line = `Last: ${prev.best.weight}kg × ${prev.best.reps}` + (prev.data.sets.length > 1 ? ` (${prev.data.sets.length} sets)` : "");
        left.appendChild(el("div", "exercise-last-week", line));
      }
      top.appendChild(left);

      const workingCurrentSets = workingSets(currentSets);
      const summary = el("div", "exercise-summary");
      if (workingCurrentSets.length > 0) {
        const best = bestSet(workingCurrentSets);
        summary.appendChild(el("div", "exercise-summary-best", `${best.weight}kg × ${best.reps}`));
        summary.appendChild(el("div", "exercise-summary-sets", `${workingCurrentSets.length} sets`));
      } else {
        summary.appendChild(el("div", "exercise-summary-empty", "–"));
      }
      summary.appendChild(el("div", "exercise-chevron" + (open ? " open" : ""), open ? "▲" : "▼"));
      if (open) summary.querySelector(".exercise-chevron").style.color = accent;
      top.appendChild(summary);

      header.appendChild(top);
    }

    function renderBody() {
      body.innerHTML = "";
      const s = saved();
      const prev = computePrevBest();

      if (prev) {
        const box = el("div", "last-week-box");
        box.style.borderLeftColor = accent;
        box.appendChild(el("div", "last-week-box-title", "LAST WEEK"));
        prev.data.sets.forEach((st) => {
          const text = `${st.weight}kg × ${st.reps}` + (st.rpe ? ` @${st.rpe}` : "") + (st.warmup ? " (w)" : "");
          box.appendChild(el("span", "last-week-box-set" + (st.warmup ? " warmup" : ""), text));
        });
        if (prev.data.note) box.appendChild(el("div", "last-week-box-note", prev.data.note));
        body.appendChild(box);
      }

      setsContainer = el("div", "sets-container");
      const initialSets = (s && s.sets && s.sets.length > 0) ? s.sets : [{ weight: "", reps: "", rpe: "" }];
      initialSets.forEach((st) => setsContainer.appendChild(buildSetRow(st, accent)));
      body.appendChild(setsContainer);

      const addBtn = el("button", "add-set-btn", "+ Add set");
      addBtn.type = "button";
      addBtn.style.borderColor = accent;
      addBtn.style.color = accent;
      addBtn.addEventListener("click", () => {
        const rows = setsContainer.querySelectorAll(".set-row");
        const lastRow = rows[rows.length - 1];
        const carryWeight = lastRow ? lastRow.querySelector(".set-input-weight").value : "";
        const carryReps = lastRow ? lastRow.querySelector(".set-input-reps").value : "";
        setsContainer.appendChild(buildSetRow({ weight: carryWeight, reps: carryReps, rpe: "" }, accent));
      });
      body.appendChild(addBtn);

      notesInput = el("textarea", "notes-textarea");
      notesInput.placeholder = "Notes (optional)";
      notesInput.rows = 2;
      notesInput.value = (s && s.note) || "";
      body.appendChild(notesInput);

      const saveBtn = el("button", "save-btn", "Save");
      saveBtn.type = "button";
      saveBtn.style.background = accent;
      saveBtn.addEventListener("click", () => {
        persistIfOpen();
        openCardPersisters = openCardPersisters.filter((fn) => fn !== persistIfOpen);
        open = false;
        body.classList.add("hidden");
        renderHeader();
        toast(`Saved ${exDef.name}`);
      });
      body.appendChild(saveBtn);
    }

    header.addEventListener("click", () => {
      if (open) {
        persistIfOpen();
        openCardPersisters = openCardPersisters.filter((fn) => fn !== persistIfOpen);
      }
      open = !open;
      if (open) {
        renderBody();
        openCardPersisters.push(persistIfOpen);
      }
      body.classList.toggle("hidden", !open);
      renderHeader();
    });

    renderHeader();
    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  // ---------- Progression view ----------

  function findAdhocStub(splitId, exId) {
    const dayData = allData[splitId];
    if (!dayData) return null;
    for (const key of Object.keys(dayData)) {
      if (key.startsWith("_")) continue;
      const adhoc = dayData[key]._adhoc;
      const match = adhoc && adhoc.find((a) => a.id === exId);
      if (match) return match;
    }
    return null;
  }

  function resolveDisplayName(splitId, storageKey) {
    const ex = findExercise(splitId, storageKey);
    if (ex) return ex.name;
    const adhoc = findAdhocStub(splitId, storageKey);
    return adhoc ? adhoc.name : "Deleted exercise";
  }

  function resolveExerciseForWeek(splitId, weekKey, exId) {
    const ex = findExercise(splitId, exId);
    if (ex) return ex;
    const weekData = allData[splitId] && allData[splitId][weekKey];
    const adhoc = weekData && weekData._adhoc && weekData._adhoc.find((a) => a.id === exId);
    if (adhoc) return { id: adhoc.id, name: adhoc.name, volume: "", intensity: "", cue: "", muscleGroup: "" };
    return null;
  }

  function isExerciseActiveForWeek(exRef, wn) {
    if (exRef.startWeek !== undefined && wn < exRef.startWeek) return false;
    if (exRef.endWeek !== undefined && wn > exRef.endWeek) return false;
    if (exRef.skipWeeks && exRef.skipWeeks.includes(wn)) return false;
    return true;
  }

  function getDisplayOrder(splitId, weekKey) {
    const split = findSplit(splitId);
    const currentWeekNum = weekNum(weekKey);
    const permanentIds = split
      ? split.exercises.filter((e) => isExerciseActiveForWeek(e, currentWeekNum)).map((e) => e.id)
      : [];
    const weekData = allData[splitId] && allData[splitId][weekKey];
    const adhocIds = (weekData && weekData._adhoc) ? weekData._adhoc.map((a) => a.id) : [];
    const allIds = [...permanentIds, ...adhocIds];
    const custom = weekData && weekData._order;
    if (!custom) return allIds;
    const known = new Set(allIds);
    const ordered = custom.filter((id) => known.has(id));
    allIds.forEach((id) => { if (!ordered.includes(id)) ordered.push(id); });
    return ordered;
  }

  function openProgression(anchorSplitId, storageKey) {
    const accent = accentFor(anchorSplitId);
    progressionViewEl.innerHTML = "";
    progressionViewEl.classList.remove("hidden");

    const headerRow = el("div", "progression-header");
    const back = el("button", "progression-back", "←");
    back.addEventListener("click", () => {
      progressionViewEl.classList.add("hidden");
      progressionViewEl.innerHTML = "";
    });
    headerRow.appendChild(back);
    const titleWrap = el("div");
    titleWrap.appendChild(el("div", "progression-title", resolveDisplayName(anchorSplitId, storageKey)));
    titleWrap.appendChild(el("div", "progression-subtitle", "Progression"));
    headerRow.appendChild(titleWrap);
    progressionViewEl.appendChild(headerRow);

    const relevantSplits = splitsUsingExercise(storageKey);
    const multiSplit = relevantSplits.length > 1;
    const entries = [];
    relevantSplits.forEach((sId) => {
      const dayData = allData[sId] || {};
      Object.keys(dayData).forEach((wk) => {
        if (wk.startsWith("_")) return;
        const data = dayData[wk][storageKey];
        if (data && data.sets && data.sets.length > 0) {
          const s = findSplit(sId);
          entries.push({ splitName: s ? s.name : sId, splitColor: accentFor(sId), week: wk, data });
        }
      });
    });

    if (entries.length === 0) {
      progressionViewEl.appendChild(el("div", "progression-empty", "No data logged yet"));
      appendRemoveControl();
      return;
    }

    const byWeek = {};
    entries.forEach((e) => {
      if (!byWeek[e.week]) byWeek[e.week] = [];
      byWeek[e.week].push(e);
    });
    const weekKeys = Object.keys(byWeek).sort((a, b) => weekNum(a) - weekNum(b));

    function buildSetChips(sets, rowAccent) {
      const best = bestSet(workingSets(sets));
      const chips = el("div", "progression-sets");
      sets.forEach((s) => {
        const isBest = best && s === best;
        const chip = el("span", "progression-set-chip" + (isBest ? " best" : "") + (s.warmup ? " warmup" : ""));
        chip.style.background = isBest ? rowAccent + "22" : "";
        chip.style.borderColor = isBest ? rowAccent : "";
        chip.style.color = isBest ? "#fff" : "";
        chip.textContent = `${s.weight}kg × ${s.reps}`;
        if (s.rpe) {
          const rpeSpan = el("span", null, ` @${s.rpe}`);
          rpeSpan.style.color = rowAccent;
          rpeSpan.style.fontSize = "11px";
          rpeSpan.style.marginLeft = "4px";
          chip.appendChild(rpeSpan);
        }
        if (s.warmup) {
          const wTag = el("span", "progression-set-warmup-tag", "warm-up");
          chip.appendChild(wTag);
        }
        if (isBest) {
          const bestTag = el("span", "progression-set-best-tag", "best");
          bestTag.style.color = rowAccent;
          chip.appendChild(bestTag);
        }
        chips.appendChild(chip);
      });
      return chips;
    }

    function volAnd1RMText(sets) {
      const working = workingSets(sets);
      const vol = totalVol(working);
      const best = bestSet(working);
      const oneRM = best ? estimate1RM(best.weight, best.reps) : 0;
      return `Vol: ${vol.toFixed(0)}kg` + (oneRM > 0 ? `  ·  Est. 1RM: ${oneRM.toFixed(0)}kg` : "");
    }

    weekKeys.forEach((wk) => {
      const splitEntries = byWeek[wk].sort((a, b) => a.splitName.localeCompare(b.splitName));
      const card = el("div", "progression-week-card");

      const head = el("div", "progression-week-head");
      const wname = el("span", "progression-week-name", wk);
      wname.style.color = accent;
      head.appendChild(wname);
      if (!multiSplit) {
        head.appendChild(el("span", "progression-week-vol", volAnd1RMText(splitEntries[0].data.sets)));
      }
      card.appendChild(head);

      splitEntries.forEach(({ splitName, splitColor, data }) => {
        if (multiSplit) {
          const subHead = el("div", "progression-split-head");
          const dot = el("span", "progression-split-dot");
          dot.style.background = splitColor;
          subHead.appendChild(dot);
          subHead.appendChild(el("span", "progression-split-name", splitName));
          subHead.appendChild(el("span", "progression-split-vol", volAnd1RMText(data.sets)));
          card.appendChild(subHead);
        }

        card.appendChild(buildSetChips(data.sets, multiSplit ? splitColor : accent));
        if (data.note) card.appendChild(el("div", "progression-note", data.note));
      });

      progressionViewEl.appendChild(card);
    });

    appendRemoveControl();

    function appendRemoveControl() {
      const anchorSplit = findSplit(anchorSplitId);
      const exRef = anchorSplit && anchorSplit.exercises.find((e) => e.id === storageKey);
      if (!exRef) return;

      const wrap = el("div", "progression-remove-wrap");
      const link = el("div", "progression-remove-link", `Remove from ${anchorSplit.name}…`);
      link.addEventListener("click", showForm);
      wrap.appendChild(link);
      progressionViewEl.appendChild(wrap);

      function showForm() {
        wrap.innerHTML = "";
        const checkRow = el("label", "quickadd-check-row");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "quickadd-checkbox";
        checkRow.appendChild(checkbox);
        checkRow.appendChild(document.createTextNode("Also remove from future weeks"));
        wrap.appendChild(checkRow);

        const btnRow = el("div", "quickadd-btn-row");
        const cancelBtn = el("button", "template-btn", "Cancel");
        cancelBtn.addEventListener("click", () => { wrap.innerHTML = ""; wrap.appendChild(link); });
        const confirmBtn = el("button", "template-btn danger", "Remove");
        confirmBtn.addEventListener("click", () => {
          const wn = state.activeWeek;
          if (checkbox.checked) {
            exRef.endWeek = wn - 1;
          } else {
            if (!exRef.skipWeeks) exRef.skipWeeks = [];
            if (!exRef.skipWeeks.includes(wn)) exRef.skipWeeks.push(wn);
          }
          saveProgram();
          renderMainView();
          progressionViewEl.classList.add("hidden");
          progressionViewEl.innerHTML = "";
          toast(checkbox.checked ? `Removed from Week ${wn} onward` : `Skipped for Week ${wn}`);
        });
        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        wrap.appendChild(btnRow);
      }
    }
  }

  // ---------- Stats view ----------

  function collectLogItems() {
    const items = [];
    program.splits.forEach((split) => {
      const dayData = allData[split.id];
      if (!dayData) return;
      Object.keys(dayData).forEach((key) => {
        if (key.startsWith("_")) return;
        const weekData = dayData[key];
        Object.keys(weekData).forEach((exKey) => {
          if (exKey.startsWith("_")) return;
          const entry = weekData[exKey];
          if (!entry || !entry.sets || entry.sets.length === 0 || !entry.date) return;
          const ex = findExercise(split.id, exKey);
          items.push({
            date: entry.date,
            splitId: split.id,
            splitName: split.name,
            weekKey: key,
            storageKey: exKey,
            displayName: resolveDisplayName(split.id, exKey),
            muscleGroup: (ex && ex.muscleGroup) || "Untagged",
            volume: totalVol(workingSets(entry.sets)),
            setCount: workingSets(entry.sets).length,
            best: bestSet(workingSets(entry.sets)),
            color: split.color,
          });
        });
      });
    });
    return items;
  }

  function buildStatsView() {
    const wrap = el("div", "view-pad");
    const items = collectLogItems();

    wrap.appendChild(el("div", "section-label", "BODYWEIGHT"));
    wrap.appendChild(buildBodyweightSection());

    if (items.length === 0) {
      wrap.appendChild(el("div", "section-label", "TRAINING"));
      wrap.appendChild(el("div", "empty-msg", "No sessions logged yet. Log a set on any split to start building your history."));
      return wrap;
    }

    wrap.appendChild(el("div", "section-label", "TRAINING"));

    const uniqueDates = [...new Set(items.map((i) => i.date))];
    const totalVolAll = items.reduce((s, i) => s + i.volume, 0);
    const weekStartISO = currentWeekStartISO();
    const thisWeekDates = new Set(uniqueDates.filter((d) => d >= weekStartISO));

    const statGrid = el("div", "stat-grid");
    const box1 = el("div", "stat-box");
    box1.appendChild(el("div", "stat-value", String(uniqueDates.length)));
    box1.appendChild(el("div", "stat-label", "Sessions"));
    const box2 = el("div", "stat-box");
    box2.appendChild(el("div", "stat-value", totalVolAll >= 1000 ? `${(totalVolAll / 1000).toFixed(1)}k` : totalVolAll.toFixed(0)));
    box2.appendChild(el("div", "stat-label", "Total Vol (kg)"));
    const box3 = el("div", "stat-box");
    box3.appendChild(el("div", "stat-value", String(thisWeekDates.size)));
    box3.appendChild(el("div", "stat-label", "This Week"));
    statGrid.appendChild(box1); statGrid.appendChild(box2); statGrid.appendChild(box3);
    wrap.appendChild(statGrid);

    if (statsWeekView === null) statsWeekView = state.activeWeek;
    const weekToShow = statsWeekView;
    const trainingWeekKey = weekLabel(weekToShow);
    const calendarWeekVol = items.filter((i) => i.date >= weekStartISO).reduce((s, i) => s + i.volume, 0);
    const trainingWeekVol = items.filter((i) => i.weekKey === trainingWeekKey).reduce((s, i) => s + i.volume, 0);

    const weekHeadRow = el("div", "stats-week-head-row");
    weekHeadRow.appendChild(el("div", "section-label", "WEEKLY VOLUME"));
    weekHeadRow.appendChild(buildStatsWeekToggle(weekToShow));
    wrap.appendChild(weekHeadRow);

    const weekVolGrid = el("div", "stat-grid");
    weekVolGrid.style.gridTemplateColumns = "repeat(2, 1fr)";
    const wbox1 = el("div", "stat-box");
    wbox1.appendChild(el("div", "stat-value", calendarWeekVol >= 1000 ? `${(calendarWeekVol / 1000).toFixed(1)}k` : calendarWeekVol.toFixed(0)));
    wbox1.appendChild(el("div", "stat-label", "Calendar Wk (kg)"));
    const wbox2 = el("div", "stat-box");
    wbox2.appendChild(el("div", "stat-value", trainingWeekVol >= 1000 ? `${(trainingWeekVol / 1000).toFixed(1)}k` : trainingWeekVol.toFixed(0)));
    wbox2.appendChild(el("div", "stat-label", `Training ${trainingWeekKey} (kg)`));
    weekVolGrid.appendChild(wbox1); weekVolGrid.appendChild(wbox2);
    wrap.appendChild(weekVolGrid);

    wrap.appendChild(el("div", "section-label", "ADHERENCE"));
    wrap.appendChild(buildHeatmap(items));

    wrap.appendChild(el("div", "section-label", `MUSCLE GROUPS · ${trainingWeekKey}`));
    wrap.appendChild(buildMuscleGroupSection(items, trainingWeekKey));

    wrap.appendChild(el("div", "section-label", "RECENT ACTIVITY"));
    wrap.appendChild(buildRecentActivity(items));

    return wrap;
  }

  let statsWeekView = null;
  let statsWeekPickerOpen = false;

  function buildStatsWeekToggle(weekToShow) {
    const wrap = el("div", "stats-week-toggle-wrap");
    const btn = el("button", "stats-week-toggle-btn", `Week ${weekToShow} ▾`);
    btn.addEventListener("click", () => {
      statsWeekPickerOpen = !statsWeekPickerOpen;
      renderMainView();
    });
    wrap.appendChild(btn);

    if (statsWeekPickerOpen) {
      const totalWeeks = allData._totalWeeks || DEFAULT_TOTAL_WEEKS;
      const grid = el("div", "stats-week-picker-grid");
      for (let w = 1; w <= totalWeeks; w++) {
        const isActive = w === weekToShow;
        const pill = el("button", "week-btn" + (isActive ? " active" : ""), `W${w}`);
        if (isActive) pill.style.background = "var(--accent)";
        pill.addEventListener("click", () => {
          statsWeekView = w;
          statsWeekPickerOpen = false;
          renderMainView();
        });
        grid.appendChild(pill);
      }
      wrap.appendChild(grid);
    }
    return wrap;
  }

  function buildBodyweightSection() {
    const wrap = el("div", "bw-wrap");

    const formCard = el("div", "settings-card");
    formCard.style.marginBottom = "14px";

    const today = parseISO(todayISO());
    const dateRow = el("div", "bw-date-row");
    const daySelect = el("select", "editor-field bw-day-select");
    for (let d = 1; d <= 31; d++) {
      const opt = el("option", null, String(d));
      opt.value = String(d);
      if (d === today.getDate()) opt.selected = true;
      daySelect.appendChild(opt);
    }
    const monthSelect = el("select", "editor-field bw-month-select");
    MONTH_SHORT_NAMES.forEach((name, i) => {
      const opt = el("option", null, name);
      opt.value = String(i + 1);
      if (i === today.getMonth()) opt.selected = true;
      monthSelect.appendChild(opt);
    });
    const yearSelect = el("select", "editor-field bw-year-select");
    const thisYear = today.getFullYear();
    for (let y = thisYear - 3; y <= thisYear; y++) {
      const opt = el("option", null, String(y));
      opt.value = String(y);
      if (y === thisYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }
    dateRow.appendChild(daySelect);
    dateRow.appendChild(monthSelect);
    dateRow.appendChild(yearSelect);
    formCard.appendChild(dateRow);

    const formRow = el("div", "bw-form-row");
    const weightInput = el("input", "editor-field bw-weight-input");
    weightInput.type = "number";
    weightInput.step = "0.1";
    weightInput.placeholder = "kg";
    formRow.appendChild(weightInput);
    const logBtn = el("button", "settings-btn bw-log-btn", "Log");
    logBtn.addEventListener("click", () => {
      const w = parseFloat(weightInput.value);
      const dd = String(daySelect.value).padStart(2, "0");
      const mm = String(monthSelect.value).padStart(2, "0");
      const isoDate = `${yearSelect.value}-${mm}-${dd}`;
      if (!w || w <= 0) { toast("Enter a weight"); return; }
      bodyweightEntries = bodyweightEntries.filter((e) => e.date !== isoDate);
      bodyweightEntries.push({ id: uid(), date: isoDate, weight: w });
      bodyweightEntries.sort((a, b) => (a.date < b.date ? 1 : -1));
      saveBodyweight();
      renderMainView();
      toast("Logged");
    });
    formRow.appendChild(logBtn);
    formCard.appendChild(formRow);
    wrap.appendChild(formCard);

    if (bodyweightEntries.length === 0) {
      wrap.appendChild(el("div", "empty-msg", "No bodyweight logged yet."));
      return wrap;
    }

    const sorted = [...bodyweightEntries].sort((a, b) => (a.date < b.date ? -1 : 1));
    const latest = sorted[sorted.length - 1];
    const summaryGrid = el("div", "stat-grid");
    summaryGrid.style.gridTemplateColumns = sorted.length > 1 ? "repeat(2, 1fr)" : "1fr";
    const latestBox = el("div", "stat-box");
    latestBox.appendChild(el("div", "stat-value", `${latest.weight}kg`));
    latestBox.appendChild(el("div", "stat-label", `Latest (${formatDateNumeric(latest.date)})`));
    summaryGrid.appendChild(latestBox);
    if (sorted.length > 1) {
      const first = sorted[0];
      const change = latest.weight - first.weight;
      const changeBox = el("div", "stat-box");
      changeBox.appendChild(el("div", "stat-value", `${change >= 0 ? "+" : ""}${change.toFixed(1)}kg`));
      changeBox.appendChild(el("div", "stat-label", `Since ${formatDateNumeric(first.date)}`));
      summaryGrid.appendChild(changeBox);
    }
    wrap.appendChild(summaryGrid);

    if (sorted.length > 1) {
      wrap.appendChild(buildBodyweightChart(sorted));
    }

    const list = el("div", "bw-list");
    [...sorted].reverse().slice(0, 10).forEach((entry) => {
      const item = el("div", "bw-item");
      const head = el("div", "bw-item-head");
      head.appendChild(el("span", "bw-item-date", formatDateNumeric(entry.date)));
      const delBtn = el("button", "editor-icon-btn danger", "×");
      delBtn.addEventListener("click", () => {
        bodyweightEntries = bodyweightEntries.filter((e) => e.id !== entry.id);
        saveBodyweight();
        renderMainView();
      });
      head.appendChild(delBtn);
      item.appendChild(head);
      item.appendChild(el("div", "bw-item-text", `${entry.weight}kg`));
      list.appendChild(item);
    });
    wrap.appendChild(list);

    return wrap;
  }

  function buildBodyweightChart(sorted) {
    const wrap = el("div", "chart-wrap");
    const width = 440;
    const height = 120;
    const padX = 16;
    const padY = 14;

    const weights = sorted.map((e) => e.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;

    const stepX = sorted.length > 1 ? (width - padX * 2) / (sorted.length - 1) : 0;
    const coords = sorted.map((e, i) => {
      const x = padX + i * stepX;
      const y = height - padY - ((e.weight - min) / range) * (height - padY * 2);
      return { x, y };
    });

    const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
    const dots = coords.map((c) => `<circle cx="${c.x}" cy="${c.y}" r="3" fill="#f97316" />`).join("");
    const firstLabel = formatDateNumeric(sorted[0].date);
    const lastLabel = formatDateNumeric(sorted[sorted.length - 1].date);

    wrap.innerHTML = `
      <svg viewBox="0 0 ${width} ${height + 18}" width="100%" height="auto" preserveAspectRatio="xMidYMid meet">
        <polyline points="${polyline}" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        ${dots}
        <text x="${padX}" y="${height + 14}" fill="#9aa0ab" font-size="11">${firstLabel}</text>
        <text x="${width - padX}" y="${height + 14}" fill="#9aa0ab" font-size="11" text-anchor="end">${lastLabel}</text>
      </svg>
    `;
    return wrap;
  }

  function buildHeatmap(items) {
    const volumeByDate = {};
    items.forEach((i) => { volumeByDate[i.date] = (volumeByDate[i.date] || 0) + i.volume; });

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - 97);
    start.setDate(start.getDate() - start.getDay());

    const nonZero = Object.values(volumeByDate).filter((v) => v > 0).sort((a, b) => a - b);
    const p33 = nonZero.length ? nonZero[Math.floor(nonZero.length * 0.33)] : 0;
    const p66 = nonZero.length ? nonZero[Math.floor(nonZero.length * 0.66)] : 0;

    function levelFor(vol) {
      if (!vol) return 0;
      if (vol >= p66) return 3;
      if (vol >= p33) return 2;
      return 1;
    }

    const container = el("div", "heatmap-wrap");
    const rowWrap = el("div", "heatmap-row-wrap");
    const labels = el("div", "heatmap-daylabels");
    ["S", "M", "T", "W", "T", "F", "S"].forEach((d) => labels.appendChild(el("div", "heatmap-daylabel", d)));
    rowWrap.appendChild(labels);

    const grid = el("div", "heatmap-grid");
    const cursor = new Date(start);
    while (cursor <= end) {
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      const vol = volumeByDate[iso] || 0;
      const cell = el("div", "heatmap-cell");
      cell.dataset.level = String(levelFor(vol));
      cell.title = vol > 0 ? `${iso}: ${vol.toFixed(0)}kg` : iso;
      grid.appendChild(cell);
      cursor.setDate(cursor.getDate() + 1);
    }
    rowWrap.appendChild(grid);
    container.appendChild(rowWrap);
    return container;
  }

  function buildMuscleGroupSection(items, trainingWeekKey) {
    const wrap = el("div");
    const thisWeekItems = items.filter((i) => i.weekKey === trainingWeekKey);

    if (thisWeekItems.length === 0) {
      wrap.appendChild(el("div", "empty-msg", "No sets logged for this week."));
      return wrap;
    }

    const byGroup = {};
    thisWeekItems.forEach((i) => { byGroup[i.muscleGroup] = (byGroup[i.muscleGroup] || 0) + i.setCount; });
    const maxSets = Math.max(...Object.values(byGroup));

    Object.keys(byGroup).sort((a, b) => byGroup[b] - byGroup[a]).forEach((group) => {
      const sets = byGroup[group];
      const row = el("div", "muscle-row");
      row.appendChild(el("div", "muscle-label", group));
      const track = el("div", "muscle-bar-track");
      const fill = el("div", "muscle-bar-fill");
      fill.style.width = `${(sets / maxSets) * 100}%`;
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "muscle-value", `${sets} sets`));
      wrap.appendChild(row);
    });

    return wrap;
  }

  function buildRecentActivity(items) {
    const wrap = el("div");
    const sorted = [...items].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return weekNum(b.weekKey) - weekNum(a.weekKey);
    }).slice(0, 20);

    sorted.forEach((i) => {
      const row = el("div", "activity-item");
      const dot = el("div", "activity-dot");
      dot.style.background = i.color;
      row.appendChild(dot);
      const main = el("div", "activity-main");
      main.appendChild(el("div", "activity-name", i.displayName));
      const topSet = i.best ? `${i.best.weight}kg × ${i.best.reps}` : "";
      main.appendChild(el("div", "activity-sub", `${i.splitName} · ${i.weekKey} · ${topSet} · ${i.setCount} sets`));
      row.appendChild(main);
      row.appendChild(el("div", "activity-date", formatDateShort(i.date)));
      wrap.appendChild(row);
    });
    return wrap;
  }

  // ---------- Backup / restore ----------

  function buildBackupBundle() {
    return {
      app: "SHFTRS",
      exportVersion: 1,
      exportedAt: todayISO(),
      program,
      library,
      allData,
      bodyweight: bodyweightEntries,
    };
  }

  function mergeImportedBundle(bundle) {
    const summary = { sessions: 0, exercises: 0, splits: 0, bodyweight: 0 };
    if (!bundle || typeof bundle !== "object") return summary;

    // Backward compatibility: earlier exports were just the raw allData object.
    const isLegacyRaw = !bundle.app && !bundle.allData && !bundle.program;
    const importedProgram = isLegacyRaw ? null : bundle.program;
    const importedLibrary = isLegacyRaw ? null : bundle.library;
    const importedAllData = isLegacyRaw ? bundle : bundle.allData;
    const importedBodyweight = isLegacyRaw ? null : bundle.bodyweight;

    if (Array.isArray(importedLibrary)) {
      importedLibrary.forEach((ex) => {
        if (ex && ex.id && !library.some((e) => e.id === ex.id)) {
          library.push(ex);
          summary.exercises++;
        }
      });
      saveLibrary();
    }

    if (importedProgram && Array.isArray(importedProgram.splits)) {
      importedProgram.splits.forEach((impSplit) => {
        const existing = program.splits.find((s) => s.id === impSplit.id);
        if (!existing) {
          program.splits.push(impSplit);
          summary.splits++;
        } else {
          (impSplit.exercises || []).forEach((impEx) => {
            if (!existing.exercises.some((e) => e.id === impEx.id)) existing.exercises.push(impEx);
          });
          (impSplit.addons || []).forEach((a) => {
            if (!existing.addons.includes(a)) existing.addons.push(a);
          });
        }
      });
      if (Array.isArray(importedProgram.templates)) {
        importedProgram.templates.forEach((t) => {
          if (t && t.id && !program.templates.some((x) => x.id === t.id)) program.templates.push(t);
        });
      }
      saveProgram();
    }

    if (importedAllData && typeof importedAllData === "object") {
      if (typeof importedAllData._totalWeeks === "number") {
        allData._totalWeeks = Math.max(allData._totalWeeks || 1, importedAllData._totalWeeks);
      }
      if (importedAllData._deloadWeeks) {
        allData._deloadWeeks = { ...importedAllData._deloadWeeks, ...(allData._deloadWeeks || {}) };
      }
      Object.keys(importedAllData).forEach((splitId) => {
        if (splitId.startsWith("_")) return;
        const impSplitData = importedAllData[splitId];
        if (!allData[splitId]) allData[splitId] = {};
        Object.keys(impSplitData).forEach((weekKey) => {
          if (weekKey.startsWith("_")) return;
          const impWeekData = impSplitData[weekKey];
          if (!allData[splitId][weekKey]) allData[splitId][weekKey] = {};
          const curWeekData = allData[splitId][weekKey];
          Object.keys(impWeekData).forEach((exKey) => {
            if (exKey === "_sessionNote") {
              if (!curWeekData._sessionNote) curWeekData._sessionNote = impWeekData._sessionNote;
              return;
            }
            if (exKey === "_adhoc") {
              if (!curWeekData._adhoc) curWeekData._adhoc = [];
              impWeekData._adhoc.forEach((a) => {
                if (!curWeekData._adhoc.some((x) => x.id === a.id)) curWeekData._adhoc.push(a);
              });
              return;
            }
            if (exKey === "_order") return;
            if (!curWeekData[exKey]) {
              curWeekData[exKey] = impWeekData[exKey];
              summary.sessions++;
            }
          });
        });
      });
      saveData();
    }

    if (Array.isArray(importedBodyweight)) {
      importedBodyweight.forEach((bw) => {
        if (bw && !bodyweightEntries.some((e) => e.id === bw.id || e.date === bw.date)) {
          bodyweightEntries.push(bw);
          summary.bodyweight++;
        }
      });
      bodyweightEntries.sort((a, b) => (a.date < b.date ? 1 : -1));
      saveBodyweight();
    }

    return summary;
  }

  // ---------- Tin Shifters (Supabase-backed shared PR board) ----------

  async function fetchTinShiftersPRs() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tin_shifters_prs?select=*`, {
      cache: "no-store",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error("Failed to load PRs");
    return res.json();
  }

  async function submitTinShiftersPR(entry) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tin_shifters_prs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to submit PR");
  }

  let tinShiftersPRs = null;
  let tinShiftersLoadError = false;
  let tinShiftersView = "leaderboard";
  let tinShiftersSelectedExercise = null;
  let tinShiftersSelectedName = null;
  let tinShiftersSubmitting = false;

  function loadTinShiftersPRs() {
    fetchTinShiftersPRs()
      .then((rows) => {
        tinShiftersPRs = rows;
        tinShiftersLoadError = false;
        if (state.activeDay === "Settings" && expandedSettingsFolders.has("tinshifters")) renderMainView();
      })
      .catch(() => {
        tinShiftersLoadError = true;
        if (state.activeDay === "Settings" && expandedSettingsFolders.has("tinshifters")) renderMainView();
      });
  }

  function buildTinShiftersLeaderboard() {
    const wrap = el("div");
    TIN_SHIFTERS_EXERCISES.forEach((exCfg) => {
      wrap.appendChild(el("div", "editor-label-small", exCfg.name.toUpperCase()));
      const entries = tinShiftersPRs.filter((p) => p.exercise_id === exCfg.id);
      const bestByName = {};
      entries.forEach((p) => {
        const existing = bestByName[p.name];
        if (!existing || exCfg.sortValue(p.entry_values) > exCfg.sortValue(existing.entry_values)) {
          bestByName[p.name] = p;
        }
      });
      const ranked = Object.values(bestByName).sort((a, b) => exCfg.sortValue(b.entry_values) - exCfg.sortValue(a.entry_values));

      if (ranked.length === 0) {
        wrap.appendChild(el("div", "empty-msg", "No PRs logged yet."));
        return;
      }
      const list = el("div", "ts-leaderboard-list");
      ranked.forEach((p, i) => {
        const row = el("div", "ts-leaderboard-row");
        row.appendChild(el("span", "ts-leaderboard-rank", `${i + 1}`));
        row.appendChild(el("span", "ts-leaderboard-name", p.name));
        row.appendChild(el("span", "ts-leaderboard-value", exCfg.formatEntry(p.entry_values)));
        row.appendChild(el("span", "ts-leaderboard-date", formatDateShort(p.date)));
        list.appendChild(row);
      });
      wrap.appendChild(list);
    });
    return wrap;
  }

  function buildTinShiftersAddForm() {
    const wrap = el("div");
    const exCfg = TIN_SHIFTERS_EXERCISES.find((e) => e.id === tinShiftersSelectedExercise);
    const fieldInputs = {};

    const exSelect = el("select", "editor-field");
    const blankEx = el("option", null, "Choose exercise…");
    blankEx.value = "";
    exSelect.appendChild(blankEx);
    TIN_SHIFTERS_EXERCISES.forEach((cfg) => {
      const opt = el("option", null, cfg.name);
      opt.value = cfg.id;
      if (tinShiftersSelectedExercise === cfg.id) opt.selected = true;
      exSelect.appendChild(opt);
    });
    exSelect.addEventListener("change", () => {
      tinShiftersSelectedExercise = exSelect.value || null;
      renderMainView();
    });
    wrap.appendChild(exSelect);

    const nameSelect = el("select", "editor-field");
    const blankName = el("option", null, "Choose your name…");
    blankName.value = "";
    nameSelect.appendChild(blankName);
    TIN_SHIFTERS_ROSTER.forEach((n) => {
      const opt = el("option", null, n);
      opt.value = n;
      if (tinShiftersSelectedName === n) opt.selected = true;
      nameSelect.appendChild(opt);
    });
    nameSelect.addEventListener("change", () => { tinShiftersSelectedName = nameSelect.value || null; });
    wrap.appendChild(nameSelect);

    if (exCfg) {
      const fieldsGrid = el("div", "editor-field-grid");
      exCfg.fields.forEach((f) => {
        const input = el("input", "editor-field");
        input.type = f.type || "number";
        if (f.step) input.step = f.step;
        input.placeholder = f.label;
        fieldInputs[f.key] = input;
        fieldsGrid.appendChild(input);
      });
      wrap.appendChild(fieldsGrid);
    }

    const btnRow = el("div", "quickadd-btn-row");
    const cancelBtn = el("button", "template-btn", "Cancel");
    cancelBtn.addEventListener("click", () => {
      tinShiftersView = "leaderboard";
      tinShiftersSelectedExercise = null;
      tinShiftersSelectedName = null;
      renderMainView();
    });
    btnRow.appendChild(cancelBtn);

    const submitBtn = el("button", "template-btn", tinShiftersSubmitting ? "Submitting…" : "Submit");
    submitBtn.disabled = tinShiftersSubmitting;
    submitBtn.addEventListener("click", () => {
      if (!exCfg) { toast("Choose an exercise"); return; }
      if (!tinShiftersSelectedName) { toast("Choose your name"); return; }
      const values = {};
      let valid = true;
      exCfg.fields.forEach((f) => {
        const raw = fieldInputs[f.key].value;
        if (raw === "") valid = false;
        values[f.key] = parseFloat(raw);
      });
      if (!valid) { toast("Fill in all fields"); return; }

      tinShiftersSubmitting = true;
      renderMainView();
      submitTinShiftersPR({
        exercise_id: exCfg.id,
        name: tinShiftersSelectedName,
        entry_values: values,
        date: todayISO(),
      })
        .then(() => {
          tinShiftersSubmitting = false;
          tinShiftersView = "leaderboard";
          tinShiftersSelectedExercise = null;
          tinShiftersSelectedName = null;
          tinShiftersPRs = null;
          toast("PR logged!");
          renderMainView();
          loadTinShiftersPRs();
        })
        .catch(() => {
          tinShiftersSubmitting = false;
          toast("Couldn't submit — try again");
          renderMainView();
        });
    });
    btnRow.appendChild(submitBtn);
    wrap.appendChild(btnRow);

    return wrap;
  }

  function buildTinShiftersSection() {
    const wrap = el("div", "ts-wrap");

    if (tinShiftersPRs === null && !tinShiftersLoadError) {
      wrap.appendChild(el("div", "empty-msg", "Loading…"));
      loadTinShiftersPRs();
      return wrap;
    }

    if (tinShiftersLoadError) {
      wrap.appendChild(el("div", "empty-msg", "Couldn't load Tin Shifters data. Check your connection."));
      const retryBtn = el("button", "settings-btn", "Retry");
      retryBtn.addEventListener("click", () => {
        tinShiftersPRs = null;
        tinShiftersLoadError = false;
        renderMainView();
      });
      wrap.appendChild(retryBtn);
      return wrap;
    }

    if (tinShiftersView === "add") {
      wrap.appendChild(buildTinShiftersAddForm());
      return wrap;
    }

    wrap.appendChild(buildTinShiftersLeaderboard());
    const addBtn = el("button", "settings-btn", "+ Add a PR");
    addBtn.addEventListener("click", () => {
      tinShiftersView = "add";
      tinShiftersSelectedExercise = null;
      tinShiftersSelectedName = null;
      renderMainView();
    });
    wrap.appendChild(addBtn);

    return wrap;
  }

  // ---------- Settings view ----------

  const expandedSettingsFolders = new Set();

  function buildSettingsFolder(id, title, buildContent) {
    const folder = el("div", "settings-folder");
    const expanded = expandedSettingsFolders.has(id);

    const header = el("div", "settings-folder-header");
    header.appendChild(el("span", "settings-folder-title", title));
    header.appendChild(el("span", "settings-folder-chevron" + (expanded ? " open" : ""), expanded ? "▲" : "▼"));
    header.addEventListener("click", () => {
      if (expanded) expandedSettingsFolders.delete(id); else expandedSettingsFolders.add(id);
      renderMainView();
    });
    folder.appendChild(header);

    if (expanded) {
      const body = el("div", "settings-folder-body");
      buildContent(body);
      folder.appendChild(body);
    }

    return folder;
  }

  function buildSettingsView() {
    const wrap = el("div", "view-pad");

    wrap.appendChild(buildSettingsFolder("program", "Program", (body) => {
      const programCard = el("div", "settings-card");
      programCard.appendChild(el("div", "settings-card-title", "Modify Splits"));
      programCard.appendChild(el("div", "settings-card-desc", "Rename splits, add or remove exercises, tag muscle groups, and save/load program templates."));
      const modifyBtn = el("button", "settings-btn", "Modify Splits →");
      modifyBtn.addEventListener("click", openSplitsEditor);
      programCard.appendChild(modifyBtn);
      body.appendChild(programCard);
    }));

    wrap.appendChild(buildSettingsFolder("backup", "Backup & Restore", (body) => {
      const card = el("div", "settings-card");
      card.style.marginBottom = "10px";
      card.appendChild(el("div", "settings-card-title", "Export backup"));
      card.appendChild(el("div", "settings-card-desc", "Downloads everything - splits, exercise library, logged history, and bodyweight - as one file. Use to back up or move your data."));
      const btn = el("button", "settings-btn", "↓  Export shftrs-backup.json");
      btn.addEventListener("click", () => {
        const json = JSON.stringify(buildBackupBundle(), null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `shftrs-backup-${todayISO()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
      card.appendChild(btn);
      body.appendChild(card);

      const importCard = el("div", "settings-card");
      importCard.appendChild(el("div", "settings-card-title", "Import backup"));
      importCard.appendChild(el("div", "settings-card-desc", "Restores from a previously exported file. Merges with what's already here - nothing already on this device gets overwritten."));
      const importLabel = el("label", "settings-btn import-btn", "↑  Choose backup file…");
      const importInput = document.createElement("input");
      importInput.type = "file";
      importInput.accept = "application/json";
      importInput.className = "import-file-input";
      importInput.addEventListener("change", () => {
        const file = importInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const bundle = JSON.parse(reader.result);
            const summary = mergeImportedBundle(bundle);
            renderTabBar(); renderWeekBar(); renderWeekPicker(); renderMainView();
            toast(`Imported: ${summary.sessions} sessions, ${summary.exercises} exercises, ${summary.bodyweight} bodyweight`);
          } catch {
            toast("Couldn't read that file");
          }
          importInput.value = "";
        };
        reader.readAsText(file);
      });
      importLabel.appendChild(importInput);
      importCard.appendChild(importLabel);
      body.appendChild(importCard);
    }));

    wrap.appendChild(buildSettingsFolder("tinshifters", "Tin Shifters", (body) => {
      body.appendChild(buildTinShiftersSection());
    }));

    const logoWrap = el("div", "settings-logo-wrap");
    const logo = document.createElement("img");
    logo.className = "settings-logo";
    logo.src = "icons/logo-shftrs.png";
    logo.alt = "Tin Shifters";
    logoWrap.appendChild(logo);
    wrap.appendChild(logoWrap);

    return wrap;
  }

  // ---------- Splits editor ----------

  function openSplitsEditor() {
    splitsEditorEl.classList.remove("hidden");
    renderSplitsEditor();
  }

  function closeSplitsEditor() {
    splitsEditorEl.classList.add("hidden");
    splitsEditorEl.innerHTML = "";
  }

  function renderSplitsEditor() {
    splitsEditorEl.innerHTML = "";

    const headerRow = el("div", "progression-header");
    const back = el("button", "progression-back", "←");
    back.addEventListener("click", closeSplitsEditor);
    headerRow.appendChild(back);
    const titleWrap = el("div");
    titleWrap.appendChild(el("div", "progression-title", "Modify Splits"));
    titleWrap.appendChild(el("div", "progression-subtitle", "Program setup"));
    headerRow.appendChild(titleWrap);
    splitsEditorEl.appendChild(headerRow);

    splitsEditorEl.appendChild(el("div", "editor-section-title", "SPLITS"));
    program.splits.forEach((split, idx) => {
      splitsEditorEl.appendChild(buildSplitEditorCard(split, idx));
    });

    const addSplitBtn = el("button", "editor-add-btn", "+ Add split");
    addSplitBtn.addEventListener("click", () => {
      const newSplit = { id: uid(), name: "New Split", color: COLOR_PALETTE[program.splits.length % COLOR_PALETTE.length], exercises: [], addons: [] };
      program.splits.push(newSplit);
      expandedSplits.add(newSplit.id);
      saveProgram();
      renderSplitsEditor();
      renderTabBar();
    });
    splitsEditorEl.appendChild(addSplitBtn);

    splitsEditorEl.appendChild(el("div", "editor-section-title", "SAVED PROGRAMS"));
    splitsEditorEl.appendChild(buildTemplatesSection());
  }

  function buildSplitEditorCard(split, idx) {
    const card = el("div", "editor-split-card");
    const header = el("div", "editor-split-header");

    const dot = el("div", "editor-color-dot");
    dot.style.background = split.color;
    header.appendChild(dot);

    const nameInput = el("input", "inline-name-input");
    nameInput.value = split.name;
    nameInput.addEventListener("blur", () => {
      split.name = nameInput.value.trim() || split.name;
      nameInput.value = split.name;
      saveProgram();
      renderTabBar();
    });
    header.appendChild(nameInput);

    const upBtn = el("button", "editor-icon-btn", "↑");
    upBtn.disabled = idx === 0;
    upBtn.addEventListener("click", () => {
      [program.splits[idx - 1], program.splits[idx]] = [program.splits[idx], program.splits[idx - 1]];
      saveProgram(); renderSplitsEditor(); renderTabBar();
    });
    header.appendChild(upBtn);

    const downBtn = el("button", "editor-icon-btn", "↓");
    downBtn.disabled = idx === program.splits.length - 1;
    downBtn.addEventListener("click", () => {
      [program.splits[idx + 1], program.splits[idx]] = [program.splits[idx], program.splits[idx + 1]];
      saveProgram(); renderSplitsEditor(); renderTabBar();
    });
    header.appendChild(downBtn);

    const delBtn = el("button", "editor-icon-btn danger", "🗑");
    delBtn.addEventListener("click", () => {
      if (!confirm(`Delete "${split.name}"? Logged history stays saved but this tab will disappear.`)) return;
      program.splits.splice(idx, 1);
      expandedSplits.delete(split.id);
      saveProgram();
      if (state.activeDay === split.id) {
        flushOpenCards();
        state.activeDay = program.splits[0] ? program.splits[0].id : "Settings";
        saveUiState();
      }
      renderSplitsEditor();
      renderTabBar(); renderWeekBar(); renderWeekPicker(); renderMainView();
    });
    header.appendChild(delBtn);

    const expanded = expandedSplits.has(split.id);
    const chevron = el("button", "editor-icon-btn", expanded ? "▲" : "▼");
    chevron.addEventListener("click", () => {
      if (expanded) expandedSplits.delete(split.id); else expandedSplits.add(split.id);
      renderSplitsEditor();
    });
    header.appendChild(chevron);

    card.appendChild(header);

    if (expanded) {
      const body = el("div", "editor-split-body");

      const colorRow = el("div", "editor-color-row");
      COLOR_PALETTE.forEach((c) => {
        const sw = el("div", "editor-color-swatch" + (c === split.color ? " selected" : ""));
        sw.style.background = c;
        sw.addEventListener("click", () => {
          split.color = c;
          saveProgram();
          renderSplitsEditor();
          renderTabBar();
        });
        colorRow.appendChild(sw);
      });
      body.appendChild(colorRow);

      body.appendChild(el("div", "editor-label-small", "EXERCISES"));
      split.exercises.forEach((ex, exIdx) => {
        body.appendChild(buildExerciseEditorRow(split, ex, exIdx));
      });

      const addExBtn = el("button", "editor-add-btn", "+ Add exercise");
      addExBtn.addEventListener("click", () => {
        if (showingAddExercisePicker.has(split.id)) showingAddExercisePicker.delete(split.id);
        else showingAddExercisePicker.add(split.id);
        renderSplitsEditor();
      });
      body.appendChild(addExBtn);

      if (showingAddExercisePicker.has(split.id)) {
        const existingIds = split.exercises.map((e) => e.id);
        const picker = buildExercisePicker({
          excludeIds: existingIds,
          onSelectExisting: (libId) => {
            const lib = findLibraryExercise(libId);
            split.exercises.push({ id: libId, name: lib.name, volume: "", intensity: "", cue: "", muscleGroup: lib.muscleGroup || "", startWeek: state.activeWeek });
            saveProgram();
            showingAddExercisePicker.delete(split.id);
            renderSplitsEditor();
            toast(`Added ${lib.name} from Week ${state.activeWeek}`);
          },
          onCreateNew: (name, muscleGroup) => {
            const id = uid();
            library.push({ id, name, muscleGroup });
            saveLibrary();
            split.exercises.push({ id, name, volume: "", intensity: "", cue: "", muscleGroup, startWeek: state.activeWeek });
            saveProgram();
            showingAddExercisePicker.delete(split.id);
            renderSplitsEditor();
            toast(`Created ${name} from Week ${state.activeWeek}`);
          },
        });
        body.appendChild(picker);
      }

      body.appendChild(el("div", "editor-label-small", "ADD-ONS"));
      body.appendChild(buildAddonsEditor(split));

      card.appendChild(body);
    }

    return card;
  }

  function buildExerciseEditorRow(split, ex, exIdx) {
    const row = el("div", "editor-exercise-row");

    const top = el("div", "editor-exercise-row-top");
    const nameInput = el("input", "editor-field editor-field-name");
    nameInput.value = ex.name;
    nameInput.placeholder = "Exercise name";
    nameInput.addEventListener("blur", () => {
      const newName = nameInput.value.trim() || ex.name;
      nameInput.value = newName;
      updateLibraryExercise(ex.id, { name: newName });
    });
    top.appendChild(nameInput);

    const upBtn = el("button", "editor-icon-btn", "↑");
    upBtn.disabled = exIdx === 0;
    upBtn.addEventListener("click", () => {
      [split.exercises[exIdx - 1], split.exercises[exIdx]] = [split.exercises[exIdx], split.exercises[exIdx - 1]];
      saveProgram(); renderSplitsEditor();
    });
    top.appendChild(upBtn);

    const downBtn = el("button", "editor-icon-btn", "↓");
    downBtn.disabled = exIdx === split.exercises.length - 1;
    downBtn.addEventListener("click", () => {
      [split.exercises[exIdx + 1], split.exercises[exIdx]] = [split.exercises[exIdx], split.exercises[exIdx + 1]];
      saveProgram(); renderSplitsEditor();
    });
    top.appendChild(downBtn);

    const delBtn = el("button", "editor-icon-btn danger", "✕");
    delBtn.addEventListener("click", () => {
      if (!confirm(`Remove "${ex.name}" starting Week ${state.activeWeek}? It'll still show in weeks before that, and logged history stays saved.`)) return;
      ex.endWeek = state.activeWeek - 1;
      saveProgram();
      renderSplitsEditor();
    });
    top.appendChild(delBtn);

    row.appendChild(top);

    if (ex.startWeek !== undefined || ex.endWeek !== undefined) {
      const bits = [];
      if (ex.startWeek !== undefined) bits.push(`active from Week ${ex.startWeek}`);
      if (ex.endWeek !== undefined) bits.push(`removed after Week ${ex.endWeek}`);
      const statusTag = el("div", "editor-week-status", bits.join(" · "));
      row.appendChild(statusTag);
    }

    const grid = el("div", "editor-field-grid");
    const volInput = el("input", "editor-field");
    volInput.placeholder = "Volume e.g. 3x8-12";
    volInput.value = ex.volume;
    volInput.addEventListener("blur", () => { ex.volume = volInput.value; saveProgram(); });
    grid.appendChild(volInput);

    const intInput = el("input", "editor-field");
    intInput.placeholder = "Intensity e.g. 1-2 RIR";
    intInput.value = ex.intensity;
    intInput.addEventListener("blur", () => { ex.intensity = intInput.value; saveProgram(); });
    grid.appendChild(intInput);
    row.appendChild(grid);

    const cueInput = el("input", "editor-field editor-field-cue");
    cueInput.placeholder = "Cue / notes";
    cueInput.value = ex.cue;
    cueInput.addEventListener("blur", () => { ex.cue = cueInput.value; saveProgram(); });
    row.appendChild(cueInput);

    const select = el("select", "editor-muscle-select");
    const blankOpt = el("option", null, "Muscle group…");
    blankOpt.value = "";
    select.appendChild(blankOpt);
    MUSCLE_GROUPS.forEach((mg) => {
      const opt = el("option", null, mg);
      opt.value = mg;
      if (ex.muscleGroup === mg) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => { updateLibraryExercise(ex.id, { muscleGroup: select.value }); });
    row.appendChild(select);

    return row;
  }

  function buildAddonsEditor(split) {
    const wrap = el("div");
    const chipsRow = el("div", "editor-addons-row");
    split.addons.forEach((a, i) => {
      const chip = el("div", "editor-addon-chip");
      chip.appendChild(el("span", null, a));
      const rm = el("button", null, "×");
      rm.addEventListener("click", () => { split.addons.splice(i, 1); saveProgram(); renderSplitsEditor(); });
      chip.appendChild(rm);
      chipsRow.appendChild(chip);
    });
    wrap.appendChild(chipsRow);

    const addRow = el("div", "editor-addon-add-row");
    const input = el("input", "editor-field");
    input.placeholder = "Add-on label";
    const addBtn = el("button", "editor-icon-btn", "+");
    addBtn.addEventListener("click", () => {
      const v = input.value.trim();
      if (!v) return;
      split.addons.push(v);
      saveProgram();
      renderSplitsEditor();
    });
    addRow.appendChild(input);
    addRow.appendChild(addBtn);
    wrap.appendChild(addRow);
    return wrap;
  }

  function buildTemplatesSection() {
    const wrap = el("div");

    const saveRow = el("div", "save-template-row");
    const input = el("input", "editor-field");
    input.placeholder = "Name this program setup…";
    const saveBtn = el("button", "editor-icon-btn", "Save");
    saveBtn.style.border = "1px solid var(--border-strong)";
    saveBtn.style.borderRadius = "8px";
    saveBtn.style.padding = "8px 14px";
    saveBtn.addEventListener("click", () => {
      const v = input.value.trim();
      if (!v) { toast("Enter a name first"); return; }
      program.templates.push({ id: uid(), name: v, savedAt: todayISO(), splits: JSON.parse(JSON.stringify(program.splits)) });
      saveProgram();
      toast(`Saved "${v}"`);
      renderSplitsEditor();
    });
    saveRow.appendChild(input);
    saveRow.appendChild(saveBtn);
    wrap.appendChild(saveRow);

    if (program.templates.length === 0) {
      wrap.appendChild(el("div", "empty-msg", "No saved programs yet."));
      return wrap;
    }

    [...program.templates].reverse().forEach((t) => {
      const row = el("div", "template-row");
      row.appendChild(el("div", "template-row-name", t.name));
      row.appendChild(el("div", "template-row-date", `Saved ${formatDateShort(t.savedAt)}`));
      const actions = el("div", "template-row-actions");
      const loadBtn = el("button", "template-btn", "Load");
      loadBtn.addEventListener("click", () => {
        if (!confirm(`Load "${t.name}"? This replaces your current active splits. Logged history is kept and stays reachable if you switch back later.`)) return;
        flushOpenCards();
        program.splits = JSON.parse(JSON.stringify(t.splits));
        saveProgram();
        state.activeDay = program.splits[0] ? program.splits[0].id : "Settings";
        state.showWeekPicker = false;
        saveUiState();
        closeSplitsEditor();
        renderTabBar(); renderWeekBar(); renderWeekPicker(); renderMainView();
        toast(`Loaded "${t.name}"`);
      });
      actions.appendChild(loadBtn);
      const delBtn = el("button", "template-btn danger", "Delete");
      delBtn.addEventListener("click", () => {
        if (!confirm(`Delete saved program "${t.name}"?`)) return;
        program.templates = program.templates.filter((x) => x.id !== t.id);
        saveProgram();
        renderSplitsEditor();
      });
      actions.appendChild(delBtn);
      row.appendChild(actions);
      wrap.appendChild(row);
    });

    return wrap;
  }

  // ---------- Init ----------

  renderTabBar();
  renderWeekBar();
  renderWeekPicker();
  renderMainView();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
