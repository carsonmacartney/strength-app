(() => {
  "use strict";

  // ---------- Constants ----------

  const PROGRAM_STORAGE_KEY = "bigLiftin_program_v1";
  const DATA_STORAGE_KEY = "bigLiftin_v1";
  const FEEDBACK_STORAGE_KEY = "shftrs_feedback_v1";
  const UI_STATE_STORAGE_KEY = "shftrs_ui_state_v1";
  const LIBRARY_STORAGE_KEY = "shftrs_library_v1";
  const DEFAULT_TOTAL_WEEKS = 8;

  const MUSCLE_GROUPS = ["Chest", "Back", "Lats", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings", "Glutes", "Calves", "Core", "Other"];
  const COLOR_PALETTE = ["#E53935", "#1E88E5", "#43A047", "#8E24AA", "#F9A825", "#00ACC1", "#D81B60", "#6D4C41", "#5E35B1", "#00897B"];

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

  function loadFeedback() {
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveFeedback() {
    try { localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackEntries)); } catch {}
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

  // Superseded by the split/week model; drop the old freeform-logging data.
  localStorage.removeItem("strength_exercises");
  localStorage.removeItem("strength_sessions");

  let program = loadProgram();
  let allData = loadData();
  if (!allData._totalWeeks) allData._totalWeeks = DEFAULT_TOTAL_WEEKS;
  let feedbackEntries = loadFeedback();
  let library = loadLibrary();

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

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function parseISO(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDateShort(iso) {
    return parseISO(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

    const removeBtn = el("button", "set-remove-btn", "×");
    removeBtn.type = "button";
    removeBtn.addEventListener("click", () => row.remove());

    row.appendChild(weightInput);
    row.appendChild(timesSpan);
    row.appendChild(repsInput);
    row.appendChild(rpeInput);
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
      return { data: { sets: combinedSets, note: notes.join(" · ") }, best: bestSet(combinedSets) };
    }

    function computeIsPR(currentSets) {
      const currentBest = bestSet(currentSets);
      if (!currentBest) return false;
      const relevantSplits = splitsUsingExercise(exDef.id);
      let allOtherSets = [];
      relevantSplits.forEach((sId) => {
        Object.entries(allData[sId] || {})
          .filter(([k]) => !(sId === splitId && k === weekKey) && !k.startsWith("_"))
          .forEach(([, wk]) => {
            if (wk[exDef.id] && wk[exDef.id].sets) allOtherSets = allOtherSets.concat(wk[exDef.id].sets);
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
      if (prev && !open) {
        const line = `Last: ${prev.best.weight}kg × ${prev.best.reps}` + (prev.data.sets.length > 1 ? ` (${prev.data.sets.length} sets)` : "");
        left.appendChild(el("div", "exercise-last-week", line));
      }
      top.appendChild(left);

      const summary = el("div", "exercise-summary");
      if (currentSets.length > 0) {
        const best = bestSet(currentSets);
        summary.appendChild(el("div", "exercise-summary-best", `${best.weight}kg × ${best.reps}`));
        summary.appendChild(el("div", "exercise-summary-sets", `${currentSets.length} sets`));
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
          const text = `${st.weight}kg × ${st.reps}` + (st.rpe ? ` @${st.rpe}` : "");
          box.appendChild(el("span", "last-week-box-set", text));
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
      const best = bestSet(sets);
      const chips = el("div", "progression-sets");
      sets.forEach((s) => {
        const isBest = s === best;
        const chip = el("span", "progression-set-chip" + (isBest ? " best" : ""));
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
        if (isBest) {
          const bestTag = el("span", "progression-set-best-tag", "best");
          bestTag.style.color = rowAccent;
          chip.appendChild(bestTag);
        }
        chips.appendChild(chip);
      });
      return chips;
    }

    weekKeys.forEach((wk) => {
      const splitEntries = byWeek[wk].sort((a, b) => a.splitName.localeCompare(b.splitName));
      const card = el("div", "progression-week-card");

      const head = el("div", "progression-week-head");
      const wname = el("span", "progression-week-name", wk);
      wname.style.color = accent;
      head.appendChild(wname);
      if (!multiSplit) {
        head.appendChild(el("span", "progression-week-vol", `Vol: ${totalVol(splitEntries[0].data.sets).toFixed(0)}kg`));
      }
      card.appendChild(head);

      splitEntries.forEach(({ splitName, splitColor, data }) => {
        if (multiSplit) {
          const subHead = el("div", "progression-split-head");
          const dot = el("span", "progression-split-dot");
          dot.style.background = splitColor;
          subHead.appendChild(dot);
          subHead.appendChild(el("span", "progression-split-name", splitName));
          subHead.appendChild(el("span", "progression-split-vol", `Vol: ${totalVol(data.sets).toFixed(0)}kg`));
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
            volume: totalVol(entry.sets),
            setCount: entry.sets.length,
            best: bestSet(entry.sets),
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

    if (items.length === 0) {
      wrap.appendChild(el("div", "empty-msg", "No sessions logged yet. Log a set on any split to start building your history."));
      return wrap;
    }

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

    const trainingWeekKey = weekLabel(state.activeWeek);
    const calendarWeekVol = items.filter((i) => i.date >= weekStartISO).reduce((s, i) => s + i.volume, 0);
    const trainingWeekVol = items.filter((i) => i.weekKey === trainingWeekKey).reduce((s, i) => s + i.volume, 0);

    wrap.appendChild(el("div", "section-label", "WEEKLY VOLUME"));
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

    wrap.appendChild(el("div", "section-label", "MUSCLE GROUPS THIS WEEK"));
    wrap.appendChild(buildMuscleGroupSection(items, weekStartISO));

    wrap.appendChild(el("div", "section-label", "VOLUME BY SPLIT"));
    wrap.appendChild(buildSplitVolumeBreakdown(items, totalVolAll));

    wrap.appendChild(el("div", "section-label", "RECENT ACTIVITY"));
    wrap.appendChild(buildRecentActivity(items));

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

  function buildMuscleGroupSection(items, weekStartISO) {
    const wrap = el("div");
    const thisWeekItems = items.filter((i) => i.date >= weekStartISO);

    if (thisWeekItems.length === 0) {
      wrap.appendChild(el("div", "empty-msg", "No sets logged yet this week."));
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

  function buildSplitVolumeBreakdown(items, totalVolAll) {
    const wrap = el("div");
    const byDay = {};
    const nameById = {};
    items.forEach((i) => {
      byDay[i.splitId] = (byDay[i.splitId] || 0) + i.volume;
      nameById[i.splitId] = i.splitName;
    });

    Object.keys(byDay).sort((a, b) => byDay[b] - byDay[a]).forEach((splitId) => {
      const vol = byDay[splitId];
      const pct = totalVolAll > 0 ? (vol / totalVolAll) * 100 : 0;
      const row = el("div", "split-volume-row");
      row.appendChild(el("div", "split-volume-label", nameById[splitId]));
      const track = el("div", "split-volume-bar-track");
      const fill = el("div", "split-volume-bar-fill");
      fill.style.width = `${pct}%`;
      fill.style.background = accentFor(splitId);
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "split-volume-value", vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol.toFixed(0)));
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

  // ---------- Settings view ----------

  function buildSettingsView() {
    const wrap = el("div", "view-pad");

    wrap.appendChild(el("div", "section-label", "PROGRAM"));
    const programCard = el("div", "settings-card");
    programCard.style.marginBottom = "20px";
    programCard.appendChild(el("div", "settings-card-title", "Modify Splits"));
    programCard.appendChild(el("div", "settings-card-desc", "Rename splits, add or remove exercises, tag muscle groups, and save/load program templates."));
    const modifyBtn = el("button", "settings-btn", "Modify Splits →");
    modifyBtn.addEventListener("click", openSplitsEditor);
    programCard.appendChild(modifyBtn);
    wrap.appendChild(programCard);

    wrap.appendChild(el("div", "section-label", "DATA"));
    const card = el("div", "settings-card");
    card.appendChild(el("div", "settings-card-title", "Export data"));
    card.appendChild(el("div", "settings-card-desc", "Downloads all logged sessions as a JSON file. Use to back up or move your data."));
    const btn = el("button", "settings-btn", "↓  Export training-data.json");
    btn.addEventListener("click", () => {
      const json = JSON.stringify(allData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `training-data-${todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    card.appendChild(btn);
    wrap.appendChild(card);

    wrap.appendChild(el("div", "section-label", "FEEDBACK"));
    const feedbackCard = el("div", "settings-card");
    feedbackCard.appendChild(el("div", "settings-card-title", "Send feedback"));
    feedbackCard.appendChild(el("div", "settings-card-desc", "Notes save on this phone. Export them whenever you want to hand them off."));
    const feedbackInput = el("textarea", "notes-textarea");
    feedbackInput.placeholder = "What's clunky? What's missing? Anything at all...";
    feedbackInput.rows = 3;
    feedbackCard.appendChild(feedbackInput);
    const addFeedbackBtn = el("button", "settings-btn", "+ Add note");
    addFeedbackBtn.addEventListener("click", () => {
      const text = feedbackInput.value.trim();
      if (!text) { toast("Write something first"); return; }
      feedbackEntries.unshift({ id: uid(), date: todayISO(), text });
      saveFeedback();
      renderMainView();
      toast("Saved");
    });
    feedbackCard.appendChild(addFeedbackBtn);
    wrap.appendChild(feedbackCard);

    if (feedbackEntries.length > 0) {
      const exportFeedbackBtn = el("button", "settings-btn", "↓  Export feedback.txt");
      exportFeedbackBtn.style.marginTop = "10px";
      exportFeedbackBtn.addEventListener("click", () => {
        const text = feedbackEntries.map((f) => `${f.date}\n${f.text}`).join("\n\n---\n\n");
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `shftrs-feedback-${todayISO()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
      wrap.appendChild(exportFeedbackBtn);

      const feedbackList = el("div", "feedback-list");
      feedbackEntries.forEach((f) => {
        const item = el("div", "feedback-item");
        const head = el("div", "feedback-item-head");
        head.appendChild(el("span", "feedback-item-date", formatDateShort(f.date)));
        const delBtn = el("button", "editor-icon-btn danger", "×");
        delBtn.addEventListener("click", () => {
          feedbackEntries = feedbackEntries.filter((x) => x.id !== f.id);
          saveFeedback();
          renderMainView();
        });
        head.appendChild(delBtn);
        item.appendChild(head);
        item.appendChild(el("div", "feedback-item-text", f.text));
        feedbackList.appendChild(item);
      });
      wrap.appendChild(feedbackList);
    }

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
