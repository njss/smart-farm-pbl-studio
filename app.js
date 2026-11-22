/* Smart Farm PBL Studio: renders phases.js, stores each team's work in localStorage,
   exports a Markdown report, and offers a facilitator view with the agenda and a timer. */
(() => {
  const S = window.STUDIO;
  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null) n.setAttribute(k, v);
    }
    kids.flat().forEach((c) => n.append(c instanceof Node ? c : document.createTextNode(c)));
    return n;
  };
  const KEY = "pbl-studio-v1";

  // ---------- storage ----------
  let store = JSON.parse(localStorage.getItem(KEY) || "null") || { current: "Team 1", teams: { "Team 1": {} } };
  const save = () => localStorage.setItem(KEY, JSON.stringify(store));
  const data = () => (store.teams[store.current] ||= {});
  const val = (phase, field) => (data()[phase] || {})[field];
  const setVal = (phase, field, v) => { (data()[phase] ||= {})[field] = v; save(); };

  let view = location.hash.slice(1) || S.phases[0].id;

  // ---------- header / nav ----------
  $("#title").textContent = S.title;
  function renderTeams() {
    const sel = $("#teamSel");
    sel.innerHTML = "";
    Object.keys(store.teams).forEach((t) => sel.append(el("option", { value: t, ...(t === store.current ? { selected: "" } : {}) }, t)));
  }
  $("#teamSel").addEventListener("change", (e) => { store.current = e.target.value; save(); render(); });
  $("#newTeam").addEventListener("click", () => {
    const name = prompt("Team name?", `Team ${Object.keys(store.teams).length + 1}`);
    if (!name) return;
    store.teams[name] ||= {};
    store.current = name;
    save(); renderTeams(); render();
  });
  $("#facBtn").addEventListener("click", () => go(view === "facilitator" ? S.phases[0].id : "facilitator"));

  function progress(phase) {
    const d = data()[phase.id] || {};
    const filled = phase.fields.filter((f) => {
      const v = d[f.id];
      if (!v) return false;
      if (Array.isArray(v)) return v.some((x) => (Array.isArray(x) ? x.some(Boolean) : x && (x.text ?? x)));
      if (typeof v === "object") return Object.keys(v).length > 0;
      return String(v).trim() !== "";
    }).length;
    return filled / phase.fields.length;
  }

  function renderNav() {
    const nav = $("#nav");
    nav.innerHTML = "";
    S.phases.forEach((p, i) => {
      const pct = Math.round(progress(p) * 100);
      nav.append(el("a", { href: "#" + p.id, class: "step" + (view === p.id ? " on" : ""), title: `${pct}% filled` },
        el("span", { class: "n" }, String(i + 1)), el("span", { class: "ic" }, p.icon), el("span", { class: "nm" }, p.name),
        el("span", { class: "bar" }, el("i", { style: `width:${pct}%` }))));
    });
  }

  // ---------- field renderers ----------
  function field(phase, f) {
    const wrap = el("div", { class: "field" }, el("label", { class: "fl" }, f.label));
    const v = val(phase.id, f.id);
    if (f.type === "text") {
      wrap.append(el("input", { value: v || "", placeholder: f.placeholder || "", oninput: (e) => setVal(phase.id, f.id, e.target.value) }));
    } else if (f.type === "textarea") {
      const ta = el("textarea", { rows: f.rows || 4, placeholder: f.placeholder || "", oninput: (e) => setVal(phase.id, f.id, e.target.value) });
      ta.value = v || "";
      wrap.append(ta);
    } else if (f.type === "list") {
      const ta = el("textarea", { rows: 4, placeholder: "One item per line", oninput: (e) => setVal(phase.id, f.id, e.target.value.split("\n")) });
      ta.value = (v || []).join("\n");
      wrap.append(ta);
    } else if (f.type === "table") {
      const rows = v || JSON.parse(JSON.stringify(f.rows || [f.columns.map(() => "")]));
      const table = el("table", { class: "grid" }, el("thead", {}, el("tr", {}, f.columns.map((c) => el("th", {}, c)))));
      const tb = el("tbody");
      const draw = () => {
        tb.innerHTML = "";
        rows.forEach((r, ri) => tb.append(el("tr", {}, r.map((cell, ci) => {
          const fixed = f.fixed && ci === 0 && ri < (f.rows || []).length;
          const ta = el("textarea", { rows: 2, ...(fixed ? { readonly: "", class: "fixed" } : {}),
            oninput: (e) => { rows[ri][ci] = e.target.value; setVal(phase.id, f.id, rows); } });
          ta.value = cell;
          return el("td", {}, ta);
        }))));
      };
      draw();
      table.append(tb);
      wrap.append(table, el("button", { type: "button", class: "ghost small", onclick: () => { rows.push(f.columns.map(() => "")); setVal(phase.id, f.id, rows); draw(); } }, "+ row"));
    } else if (f.type === "vote") {
      const items = v || [];
      const list = el("ul", { class: "votes" });
      const draw = () => {
        list.innerHTML = "";
        [...items].map((it, i) => [it, i]).sort((a, b) => b[0].votes - a[0].votes).forEach(([it, i]) => list.append(el("li", {},
          el("span", { class: "dots" }, [0, 1, 2, 3, 4, 5].map((k) => el("button", { type: "button", class: "dot" + (k < it.votes ? " on" : ""),
            "aria-label": `${k + 1} votes`, onclick: () => { it.votes = it.votes === k + 1 ? k : k + 1; setVal(phase.id, f.id, items); draw(); } }))),
          el("span", { class: "it" }, it.text),
          el("button", { type: "button", class: "x", "aria-label": "remove", onclick: () => { items.splice(i, 1); setVal(phase.id, f.id, items); draw(); } }, "×"))));
      };
      const input = el("input", { placeholder: "Add an idea and press Enter" });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim()) { items.push({ text: input.value.trim(), votes: 0 }); input.value = ""; setVal(phase.id, f.id, items); draw(); }
      });
      draw();
      wrap.append(input, list);
    } else if (f.type === "rating") {
      const r = v || {};
      wrap.append(el("table", { class: "rating" }, el("tbody", {}, f.items.map((item, i) => el("tr", {}, el("td", {}, item),
        el("td", { class: "scale" }, [1, 2, 3, 4].map((n) => el("label", {},
          el("input", { type: "radio", name: `${phase.id}-${f.id}-${i}`, value: n, ...(r[i] == n ? { checked: "" } : {}),
            onchange: () => { r[i] = n; setVal(phase.id, f.id, r); } }), " " + n))))))));
    }
    return wrap;
  }

  // ---------- views ----------
  function renderPhase(p) {
    const idx = S.phases.indexOf(p);
    const slot = S.agenda.find((a) => a.phase === p.id);
    const links = (p.links || []).map((k) => el("a", { class: "applink", href: S.apps[k], target: "_blank", rel: "noopener" },
      { twin: "🌐 Open the digital twin", chatbot: "💬 Open the chatbot", sensors: "📡 Sensor simulator repo" }[k]));
    return el("section", { class: "phase" },
      el("div", { class: "phead" },
        el("div", {}, el("p", { class: "kicker" }, `Phase ${idx + 1} · ${p.dt}${slot ? ` · ${slot.time}, ${slot.min} min` : ""}`),
          el("h2", {}, `${p.icon} ${p.name}`), el("p", { class: "goal" }, p.goal)),
        el("div", { class: "dq" }, el("b", {}, "Driving question"), el("p", {}, S.drivingQuestion))),
      el("div", { class: "cols" },
        el("div", { class: "card" }, el("h3", {}, "Activities"), el("ol", {}, p.activities.map((a) => el("li", {}, a))),
          links.length ? el("div", { class: "links" }, links) : "",
          el("p", { class: "deliv" }, el("b", {}, "Deliverable: "), p.deliverable)),
        el("div", { class: "card canvas" }, el("h3", {}, `Team canvas · ${store.current}`), p.fields.map((f) => field(p, f)))),
      el("div", { class: "pager no-print" },
        idx > 0 ? el("a", { href: "#" + S.phases[idx - 1].id }, "← " + S.phases[idx - 1].name) : el("span"),
        idx < S.phases.length - 1 ? el("a", { href: "#" + S.phases[idx + 1].id }, S.phases[idx + 1].name + " →") : el("span")));
  }

  let timer = null;
  function renderFacilitator() {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const rows = S.agenda.map((a) => {
      const [h, m] = a.time.split(":").map(Number);
      const start = h * 60 + m, live = mins >= start && mins < start + a.min;
      const p = S.phases.find((x) => x.id === a.phase);
      return el("tr", { class: live ? "live" : "" }, el("td", {}, a.time), el("td", {}, `${a.min} min`),
        el("td", {}, p ? el("a", { href: "#" + p.id }, `${p.icon} ${p.name}`) : a.label),
        el("td", {}, p ? p.deliverable : ""),
        el("td", {}, p ? el("button", { type: "button", class: "small", onclick: () => startTimer(a.min, p.name) }, "Start timer") : ""));
    });
    const teams = Object.entries(store.teams).map(([name, d]) => el("tr", {}, el("td", {}, name),
      S.phases.map((p) => { const keep = store.current; store.current = name; const pct = Math.round(progress(p) * 100); store.current = keep;
        return el("td", { class: "pct", style: `--p:${pct}%` }, pct ? pct + "%" : "–"); })));
    return el("section", { class: "phase" },
      el("h2", {}, "Facilitator view"),
      el("div", { id: "timer", class: "timer" }, el("span", { id: "tlabel" }, "No timer running"), el("b", { id: "tclock" }, "--:--"),
        el("button", { type: "button", class: "ghost small", onclick: () => { clearInterval(timer); $("#tclock").textContent = "--:--"; $("#tlabel").textContent = "No timer running"; } }, "Stop")),
      el("div", { class: "card" }, el("h3", {}, "Agenda"), el("table", { class: "agenda" },
        el("thead", {}, el("tr", {}, ["Time", "Length", "Phase", "Deliverable", ""].map((h) => el("th", {}, h)))), el("tbody", {}, rows))),
      el("div", { class: "card" }, el("h3", {}, "Team progress (this device)"), el("table", { class: "agenda" },
        el("thead", {}, el("tr", {}, el("th", {}, "Team"), S.phases.map((p) => el("th", { title: p.name }, p.icon)))), el("tbody", {}, teams)),
        el("p", { class: "hint" }, "Teams on other laptops can send you their .json file to load here.")));
  }

  function startTimer(min, name) {
    clearInterval(timer);
    const end = Date.now() + min * 60000;
    $("#tlabel").textContent = name;
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      const t = $("#tclock");
      if (!t) return clearInterval(timer);
      t.textContent = `${String(Math.floor(left / 60000)).padStart(2, "0")}:${String(Math.floor(left / 1000) % 60).padStart(2, "0")}`;
      t.classList.toggle("late", left < 5 * 60000);
      if (!left) clearInterval(timer);
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  function render() {
    renderTeams();
    renderNav();
    const main = $("#main");
    main.innerHTML = "";
    const p = S.phases.find((x) => x.id === view);
    main.append(view === "facilitator" || !p ? renderFacilitator() : renderPhase(p));
    $("#facBtn").textContent = view === "facilitator" ? "Back to phases" : "Facilitator view";
    window.scrollTo(0, 0);
  }
  function go(id) { location.hash = id; }
  addEventListener("hashchange", () => { view = location.hash.slice(1) || S.phases[0].id; render(); });
  document.addEventListener("input", () => renderNav());

  // ---------- export / import ----------
  function download(name, text, type) {
    const a = el("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name });
    document.body.append(a); a.click(); a.remove();
  }
  function markdown() {
    const d = data();
    const out = [`# ${store.current}: ${S.title}`, "", `_Generated ${new Date().toLocaleString()}_`, "", `> **Driving question:** ${S.drivingQuestion}`, ""];
    S.phases.forEach((p) => {
      out.push(`## ${p.icon} ${p.name}`, "");
      p.fields.forEach((f) => {
        const v = (d[p.id] || {})[f.id];
        if (!v || (Array.isArray(v) && !v.length)) return;
        out.push(`**${f.label}**`, "");
        if (f.type === "list") out.push(...v.filter(Boolean).map((x) => `- ${x}`));
        else if (f.type === "vote") out.push(...[...v].sort((a, b) => b.votes - a.votes).map((x) => `- ${x.text} (${x.votes} votes)`));
        else if (f.type === "table") out.push(`| ${f.columns.join(" | ")} |`, `|${f.columns.map(() => " --- ").join("|")}|`, ...v.map((r) => `| ${r.map((c) => (c || "").replace(/\n/g, " ")).join(" | ")} |`));
        else if (f.type === "rating") out.push(...f.items.map((it, i) => `- ${it}: **${v[i] ?? "–"}** / 4`));
        else out.push(String(v));
        out.push("");
      });
    });
    return out.join("\n");
  }
  const slug = () => store.current.replace(/[^\w-]+/g, "-").toLowerCase();
  $("#exportMd").addEventListener("click", () => download(`${slug()}-report.md`, markdown(), "text/markdown"));
  $("#exportJson").addEventListener("click", () => download(`${slug()}.json`, JSON.stringify({ team: store.current, data: data() }, null, 2), "application/json"));
  $("#importJson").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      store.teams[obj.team || f.name] = obj.data || {};
      store.current = obj.team || f.name;
      save(); render();
    } catch { alert("This file is not a team file from the studio."); }
    e.target.value = "";
  });
  $("#printBtn").addEventListener("click", () => print());

  render();
})();
