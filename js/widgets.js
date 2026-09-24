window.PDE_WIDGETS = {
  storage(root, onDone) {
    const steps = [
      {
        k: "latency",
        q: "What latency can the consumer tolerate?",
        opts: [
          ["sql", "Seconds are fine — analysts write SQL"],
          ["ms", "Milliseconds on a key lookup"],
          ["files", "Just store objects / files"],
          ["global", "Global transactions, external consistency"]
        ]
      },
      {
        k: "shape",
        q: "What is the shape of the workload?",
        opts: [
          ["wh", "Warehouse analytics / BI / BQML"],
          ["ts", "Time series / IoT / huge write QPS"],
          ["oltp", "Relational OLTP (rows, joins, constraints)"],
          ["doc", "Document / mobile app state"],
          ["cache", "Hot cache in front of something else"]
        ]
      },
      {
        k: "geo",
        q: "Where must the data live?",
        opts: [
          ["one", "One region is enough"],
          ["eu", "EU / residency lock at create time"],
          ["world", "Multi-region, strongly consistent writes"]
        ]
      },
      {
        k: "estate",
        q: "What already exists?",
        opts: [
          ["new", "Greenfield"],
          ["pg", "A PostgreSQL / MySQL app"],
          ["spark", "Spark / Hive / Hadoop jobs"],
          ["cdc", "Oracle / MySQL that must stream changes"]
        ]
      }
    ];
    const answers = {};
    let i = 0;

    function verdict() {
      const { latency, shape, geo, estate } = answers;
      let primary = "BigQuery";
      let secondary = "Cloud Storage as landing zone";
      let trap = "Do not use Bigtable as an analyst SQL workbench.";

      if (latency === "files" || shape === "files") {
        primary = "Cloud Storage";
        secondary = "BigLake / external tables if you still want SQL";
        trap = "GCS is not a query engine. Add BigQuery or BigLake to analyze.";
      }
      if (shape === "ts" || latency === "ms") {
        primary = "Bigtable";
        secondary = "Pub/Sub + Dataflow to land, GCS for cold archive";
        trap = "Never prefix row keys with a monotonic timestamp — you will hotspot one tablet.";
      }
      if (shape === "oltp" && geo !== "world") {
        primary = estate === "pg" ? "Cloud SQL (or AlloyDB if analytics-on-OLTP is heavy)" : "Cloud SQL";
        secondary = "AlloyDB if Postgres-compatible and analytical reads are loud";
        trap = "Spanner works but you will overpay for a regional 200 GB app.";
      }
      if (latency === "global" || geo === "world") {
        primary = "Spanner";
        secondary = "BigQuery for the warehouse copy";
        trap = "Cloud SQL HA is still regional. HA ≠ global external consistency.";
      }
      if (shape === "doc") {
        primary = "Firestore";
        secondary = "Memorystore if you also need a blistering cache";
        trap = "Firestore is not a 40 TB click warehouse.";
      }
      if (shape === "cache") {
        primary = "Memorystore";
        secondary = "Keep the system of record elsewhere";
        trap = "A cache is not a source of truth.";
      }
      if (shape === "wh" || latency === "sql") {
        if (primary === "BigQuery" || shape === "wh") {
          primary = "BigQuery";
          secondary = "Partition by the date every query filters; cluster by the next filter/join";
          trap = "BigQuery is a terrible inventory-reservation OLTP store.";
        }
      }
      if (estate === "spark") {
        secondary = "Dataproc for the existing Spark estate; sink to GCS/BigQuery";
      }
      if (estate === "cdc") {
        secondary = "Datastream CDC into BigQuery (or GCS then Dataform)";
      }
      if (geo === "eu" && primary === "BigQuery") {
        secondary += ". Create the dataset in eu / an EU region — location is frozen at create time.";
      }
      return { primary, secondary, trap };
    }

    function draw() {
      if (i >= steps.length) {
        const v = verdict();
        root.innerHTML = `
          <div class="card">
            <p class="kicker">Storage wizard</p>
            <h3>Primary pick</h3>
            <p style="font-size:22px;font-family:var(--display);margin:8px 0 12px">${v.primary}</p>
            <p><b>Also.</b> ${v.secondary}</p>
            <p class="not" style="color:var(--bad);margin-top:10px"><b>Trap.</b> ${v.trap}</p>
            <p style="margin-top:16px"><button class="btn primary" id="lab-done">Mark lab complete</button>
            <button class="btn" id="lab-reset">Run again</button></p>
          </div>`;
        root.querySelector("#lab-done").onclick = () => onDone("storage");
        root.querySelector("#lab-reset").onclick = () => { i = 0; Object.keys(answers).forEach((k) => delete answers[k]); draw(); };
        return;
      }
      const s = steps[i];
      root.innerHTML = `
        <div class="card wizard">
          <p class="kicker">Storage wizard · ${i + 1}/${steps.length}</p>
          <h3>${s.q}</h3>
          <div style="margin-top:12px" id="opts"></div>
        </div>`;
      const box = root.querySelector("#opts");
      s.opts.forEach(([val, label]) => {
        const b = document.createElement("button");
        b.className = "opt";
        b.textContent = label;
        b.onclick = () => { answers[s.k] = val; i += 1; draw(); };
        box.appendChild(b);
      });
    }
    draw();
  },

  windows(root, onDone) {
    const events = [
      { t: 9.03, label: "9:02", late: false },
      { t: 9.30, label: "9:18", late: false },
      { t: 9.52, label: "9:31", late: false },
      { t: 9.98, label: "9:59", late: false },
      { t: 10.12, label: "10:07 arr / et 9:50", late: true, et: 9.83 }
    ];
    const state = { mode: "fixed", water: 10.0, lateMin: 15 };

    function classify() {
      return events.map((e) => {
        const eventTime = e.et || e.t;
        const late = eventTime < state.water;
        const allowed = state.lateMin / 60;
        let status = "on-time";
        if (late && state.water - eventTime > allowed) status = "dropped";
        else if (late) status = "late pane";
        return { ...e, eventTime, status };
      });
    }

    function bands() {
      if (state.mode === "fixed") {
        return [[9.0, 9.17], [9.17, 9.33], [9.33, 9.5], [9.5, 9.67], [9.67, 9.83], [9.83, 10.0], [10.0, 10.17]];
      }
      if (state.mode === "sliding") {
        return [[9.0, 9.17], [9.08, 9.25], [9.17, 9.33], [9.25, 9.42], [9.33, 9.5]];
      }
      return [[9.02, 9.45], [9.31, 10.0]];
    }

    function pct(hour) {
      return ((hour - 9) / 1.25) * 100;
    }

    function draw() {
      const cls = classify();
      const wins = bands();
      root.innerHTML = `
        <div class="card">
          <p class="kicker">Windowing lab</p>
          <h3>Event time vs watermark</h3>
          <p>The 10:07 arrival carries event-time 9:50. If the watermark already passed 10:00, that record is late.</p>
          <div class="chips" style="margin:12px 0">
            <button class="btn" data-m="fixed">Fixed 10m</button>
            <button class="btn" data-m="sliding">Sliding</button>
            <button class="btn" data-m="session">Session</button>
          </div>
          <label class="muted">Watermark
            <input id="wm" type="range" min="9" max="10.25" step="0.05" value="${state.water}">
            <span id="wml"></span>
          </label>
          <div style="margin:8px 0">
            Allowed lateness
            <select id="al">
              <option value="0">0 min</option>
              <option value="5">5 min</option>
              <option value="15">15 min</option>
            </select>
          </div>
          <div class="timeline" id="tl"></div>
          <ul id="list" style="color:var(--muted)"></ul>
          <button class="btn primary" id="lab-done">Mark lab complete</button>
        </div>`;
      root.querySelector("#al").value = String(state.lateMin);
      const tl = root.querySelector("#tl");
      wins.forEach((w, idx) => {
        const d = document.createElement("div");
        d.className = "window-band";
        d.style.left = pct(w[0]) + "%";
        d.style.width = Math.max(4, pct(w[1]) - pct(w[0])) + "%";
        d.style.background = idx % 2 ? "var(--d1)" : "var(--d2)";
        tl.appendChild(d);
      });
      const wm = document.createElement("div");
      wm.className = "watermark";
      wm.style.left = pct(state.water) + "%";
      tl.appendChild(wm);
      events.forEach((e) => {
        const d = document.createElement("div");
        d.className = "event" + (e.late ? " late" : "");
        d.style.left = pct(e.t) + "%";
        d.title = e.label;
        tl.appendChild(d);
      });
      root.querySelector("#wml").textContent = " " + fmt(state.water);
      root.querySelector("#list").innerHTML = cls.map((e) =>
        `<li>${e.label} → <b style="color:${e.status === "dropped" ? "var(--bad)" : e.status === "late pane" ? "var(--d5)" : "var(--ok)"}">${e.status}</b></li>`
      ).join("");
      root.querySelectorAll("[data-m]").forEach((b) => b.onclick = () => { state.mode = b.dataset.m; draw(); });
      root.querySelector("#wm").oninput = (ev) => { state.water = Number(ev.target.value); draw(); };
      root.querySelector("#al").onchange = (ev) => { state.lateMin = Number(ev.target.value); draw(); };
      root.querySelector("#lab-done").onclick = () => onDone("windows");
    }

    function fmt(h) {
      const hr = Math.floor(h);
      const m = Math.round((h - hr) * 60);
      return hr + ":" + String(m).padStart(2, "0");
    }
    draw();
  },

  rowkey(root, onDone) {
    const state = { pattern: "timestamp#deviceId" };

    function hotspot(p) {
      const left = p.split("#")[0] || p;
      return /time|ts|date|2026/i.test(left);
    }

    function draw() {
      const hot = hotspot(state.pattern);
      root.innerHTML = `
        <div class="card">
          <p class="kicker">Bigtable row-key lab</p>
          <h3>Spread writes or melt one tablet</h3>
          <p>12 columns = tablets. A monotonic left token follows the clock onto a single tablet.</p>
          <p>
            <button class="btn" data-p="timestamp#deviceId">Bad: time#device</button>
            <button class="btn" data-p="deviceId#reverseTs">Good: device#time</button>
            <button class="btn" data-p="{rand}#timestamp">Good: hash#time</button>
          </p>
          <input id="pat" value="${state.pattern}" style="width:100%;margin:10px 0;padding:8px;border-radius:8px;border:1px solid var(--line);background:#0b0d14;color:var(--text)">
          <div class="heat" id="heat"></div>
          <p id="banner" style="margin-top:12px;font-weight:700"></p>
          <button class="btn primary" id="lab-done">Mark lab complete</button>
        </div>`;
      const heat = root.querySelector("#heat");
      for (let i = 0; i < 12; i++) {
        const c = document.createElement("div");
        c.className = "cell";
        if (hot) {
          c.style.background = i === 10 ? "#fb7185" : "#1c2233";
          c.style.opacity = i === 10 ? "1" : ".35";
        } else {
          const v = 0.35 + ((i * 7) % 5) * 0.12;
          c.style.background = `rgba(46,230,199,${v})`;
        }
        heat.appendChild(c);
      }
      const banner = root.querySelector("#banner");
      banner.textContent = hot ? "HOTSPOT — time is the leftmost token." : "Writes spread across tablets.";
      banner.style.color = hot ? "var(--d5)" : "var(--ok)";
      root.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => { state.pattern = b.dataset.p; draw(); });
      root.querySelector("#pat").onchange = (e) => { state.pattern = e.target.value; draw(); };
      root.querySelector("#lab-done").onclick = () => onDone("rowkey");
    }
    draw();
  },

  pipeline(root, onDone) {
    const scenarios = [
      { id: "click", title: "Clickstream minute metrics", need: ["Pub/Sub", "Dataflow", "BigQuery"], ok: ["Pub/Sub", "Dataflow", "BigQuery"] },
      { id: "night", title: "Nightly Parquet in GCS", need: ["Cloud Storage", "Dataform", "BigQuery"], alt: ["Cloud Storage", "Dataflow", "BigQuery"] },
      { id: "ora", title: "Oracle CDC to warehouse", need: ["Datastream", "BigQuery"] },
      { id: "spark", title: "Existing Spark estate", need: ["Dataproc", "BigQuery"], alt: ["Dataproc", "Cloud Storage"] }
    ];
    const palette = ["Cloud Storage", "Pub/Sub", "Dataflow", "Dataproc", "Dataform", "Datastream", "BigQuery", "Composer", "Bigtable", "Firestore"];
    let sIdx = 0;
    let picked = [];

    function score() {
      const s = scenarios[sIdx];
      const set = picked.join(">");
      const want = s.need.join(">");
      const alt = (s.alt || []).join(">");
      if (picked.length === s.need.length && s.need.every((n, i) => picked[i] === n)) return 100;
      if (s.alt && picked.length === s.alt.length && s.alt.every((n, i) => picked[i] === n)) return 100;
      if (picked.includes("Firestore") && s.id !== "x") return 0;
      if (picked[picked.length - 1] === s.need[s.need.length - 1] || (s.alt && picked[picked.length - 1] === s.alt[s.alt.length - 1])) return 60;
      return set.includes(want) || (alt && set.includes(alt)) ? 80 : 20;
    }

    function draw() {
      const s = scenarios[sIdx];
      root.innerHTML = `
        <div class="card">
          <p class="kicker">Pipeline builder · ${sIdx + 1}/4</p>
          <h3>${s.title}</h3>
          <p>Add nodes in order. Target shape: ${s.need.join(" → ")}${s.alt ? " (or " + s.alt.join(" → ") + ")" : ""}.</p>
          <div class="pipeline" id="pipe">${picked.map((p) => `<span class="node">${p}</span>`).join("") || "<span style='color:var(--faint)'>empty</span>"}</div>
          <div class="chips" id="pal" style="margin-top:10px"></div>
          <p style="margin-top:10px">
            <button class="btn" id="undo">Undo</button>
            <button class="btn primary" id="grade">Grade</button>
            <button class="btn" id="next">Next scenario</button>
          </p>
          <p id="out"></p>
        </div>`;
      const pal = root.querySelector("#pal");
      palette.forEach((name) => {
        const b = document.createElement("button");
        b.className = "btn";
        b.textContent = name;
        b.onclick = () => { if (picked.length < 4) picked.push(name); draw(); };
        pal.appendChild(b);
      });
      root.querySelector("#undo").onclick = () => { picked.pop(); draw(); };
      root.querySelector("#grade").onclick = () => {
        const sc = score();
        root.querySelector("#out").innerHTML = `<b>${sc}/100.</b> ${sc >= 80 ? "Exam-shaped." : "Re-read the constraint — warehouse sinks beat Firestore, windows need Dataflow, Spark estates keep Dataproc."}`;
        if (sc >= 80) onDone("pipeline");
      };
      root.querySelector("#next").onclick = () => { sIdx = (sIdx + 1) % scenarios.length; picked = []; draw(); };
    }
    draw();
  },

  iam(root, onDone) {
    const state = { project: false, dataset: true, column: true };
    function draw() {
      const analyst = state.dataset && !state.column;
      const compliance = true;
      const intern = state.project && !state.column;
      root.innerHTML = `
        <div class="card">
          <p class="kicker">IAM inheritance lab</p>
          <h3>Org → folder → project → dataset → column</h3>
          <p>Policies flow down. A policy tag on <code>national_id</code> can hide the column even when the table is readable.</p>
          <label><input type="checkbox" id="p" ${state.project ? "checked" : ""}> Grant <code>bigquery.dataViewer</code> on the project</label><br>
          <label><input type="checkbox" id="d" ${state.dataset ? "checked" : ""}> Grant viewer on dataset <code>pii</code></label><br>
          <label><input type="checkbox" id="c" ${state.column ? "checked" : ""}> Policy tag denies <code>national_id</code> to Analyst + Intern</label>
          <table class="matrix" style="margin-top:14px">
            <tr><th>Persona</th><th>Can query table</th><th>Sees raw national_id</th></tr>
            <tr><td>Analyst</td><td>${state.dataset || state.project ? "yes" : "no"}</td><td>${analyst ? "yes" : "no"}</td></tr>
            <tr><td>Compliance</td><td>yes (tagged role)</td><td>${compliance ? "yes" : "no"}</td></tr>
            <tr><td>Intern</td><td>${intern || (state.dataset && state.project) ? "depends — least privilege says no project-wide grant" : "no"}</td><td>no</td></tr>
          </table>
          <p style="color:var(--muted);margin-top:10px">Prod isolation is a <b>separate project</b>, not a second dataset in the sandbox project.</p>
          <button class="btn primary" id="lab-done">Mark lab complete</button>
        </div>`;
      root.querySelector("#p").onchange = (e) => { state.project = e.target.checked; draw(); };
      root.querySelector("#d").onchange = (e) => { state.dataset = e.target.checked; draw(); };
      root.querySelector("#c").onchange = (e) => { state.column = e.target.checked; draw(); };
      root.querySelector("#lab-done").onclick = () => onDone("iam");
    }
    draw();
  }
};
