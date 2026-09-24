window.PDE_APP = (function () {
  const S = window.PDE_STATE;
  const C = window.PDE_CONTENT;
  let view;

  function $(sel, el) { return (el || document).querySelector(sel); }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => { t.style.display = "none"; }, 2400);
  }

  function domainById(id) { return C.domains.find((d) => d.id === id); }

  function topicPct(d) {
    const n = d.topics.filter((t) => S.get().completedTopics[d.id + ":" + t.id]).length;
    return d.topics.length ? n / d.topics.length : 0;
  }

  function domainScore(d) {
    const t = topicPct(d);
    const q = S.get().quizBest[d.id] || 0;
    return t * 0.55 + q * 0.45;
  }

  function go(hash) {
    location.hash = "#/" + hash;
  }

  function sidebar() {
    const st = S.get();
    const rank = S.rankFor(st.xp);
    const span = Math.max(1, rank.next.xp - rank.current.xp);
    const into = Math.min(1, (st.xp - rank.current.xp) / span);
    $("#xp-fill").style.width = (rank.next === rank.current ? 100 : into * 100) + "%";
    $("#xp-label").textContent = st.xp + " XP";
    $("#rank-label").textContent = rank.current.name;
    $("#streak-label").textContent = (st.streak || 0) + " day streak";
    document.querySelectorAll(".nav-btn").forEach((b) => {
      const r = b.getAttribute("data-go") || "";
      const here = location.hash.slice(2) || "home";
      b.classList.toggle("active", r && (here === r || here.startsWith(r + "/") || (r === "lab" && here.startsWith("lab"))));
    });
  }

  function layout(kicker, title, lede, extra) {
    const st = S.get();
    return `
      <div class="topbar">
        <div>
          <p class="kicker">${kicker}</p>
          <h2 class="page-title">${title}</h2>
          ${lede ? `<p class="lede">${lede}</p>` : ""}
        </div>
        <div class="stats">
          <span class="pill"><b>${st.xp}</b> XP</span>
          <span class="pill"><b>${S.rankFor(st.xp).current.name}</b></span>
          <span class="pill">streak <b>${st.streak || 0}</b></span>
        </div>
      </div>
      ${extra || ""}`;
  }

  function renderHome() {
    const st = S.get();
    const q = st.dailyQuest;
    const questReady = q && q.progress >= q.target && !q.claimed;
    const cards = C.domains.map((d) => {
      const pct = Math.round(domainScore(d) * 100);
      return `
        <article class="card domain-card" data-go="domain/${d.id}">
          <span class="pct">${pct}%</span>
          <p class="weight">DOMAIN 0${d.n} · ${d.weight}%</p>
          <h3>${d.title}</h3>
          <p>${d.blurb}</p>
        </article>`;
    }).join("");
    const doneTopics = Object.keys(st.completedTopics).length;
    const totalTopics = C.domains.reduce((n, d) => n + d.topics.length, 0);
    const weakest = C.domains.slice().sort((a, b) => domainScore(a) - domainScore(b))[0];
    view.innerHTML = layout(
      "PDE Study OS",
      "Five domains. One exam.",
      "Official blueprint: 2 hours, 40–50 questions, $200. Train decisions, not trivia.",
      `
      <div class="quest">
        <div>
          <p class="kicker">Daily quest</p>
          <strong>${q ? q.label : "—"}</strong>
          <div style="color:var(--muted);font-size:13px">${q ? q.progress + " / " + q.target : ""}</div>
        </div>
        <button class="btn primary" id="claim" ${questReady ? "" : "disabled"}>${q && q.claimed ? "Claimed" : "Claim +25 XP"}</button>
      </div>
      <div class="grid grid-5">${cards}</div>
      <div class="grid grid-3" style="margin-top:16px">
        <div class="card"><h3>Progress</h3><p>${doneTopics}/${totalTopics} topics · ${st.dojoCleared.length}/8 dojo · ${st.labsDone.length}/5 labs · ${st.examHistory.length} mock(s)</p></div>
        <div class="card" data-go="domain/${weakest.id}" style="cursor:pointer"><h3>Weakest channel</h3><p>${weakest.title} — push this before adding new topics.</p></div>
        <div class="card" data-go="exam" style="cursor:pointer"><h3>Exam stamina</h3><p>Last mock: ${st.examHistory.length ? Math.round(st.examHistory[st.examHistory.length - 1].score * 100) + "%" : "not taken"}</p></div>
      </div>`
    );
    $("#claim").onclick = () => {
      const xp = S.claimQuest();
      if (xp) toast("+25 XP quest complete");
      route();
    };
  }

  function renderDomain(id) {
    const d = domainById(id);
    if (!d) return renderHome();
    const st = S.get();
    const topics = d.topics.map((t) => {
      const done = !!st.completedTopics[d.id + ":" + t.id];
      return `
        <div class="topic ${done ? "done" : ""}" data-go="topic/${d.id}/${t.id}">
          <div class="check">${done ? "✓" : ""}</div>
          <div>
            <strong>${t.title}</strong>
            <p>${t.summary}</p>
            <div class="chips">${t.chips.map((c) => `<span class="chip">${c}</span>`).join("")}</div>
          </div>
          <span class="weight">${t.minutes} min</span>
        </div>`;
    }).join("");
    view.innerHTML = layout(
      `Domain 0${d.n} · ${d.weight}% of the exam`,
      d.title,
      d.blurb,
      `
      <div class="chips" style="margin-bottom:14px">
        <button class="btn primary" data-go="quiz/${d.id}">Domain quiz</button>
        <button class="btn" data-go="cards/${d.id}">Flashcards</button>
        <button class="btn" data-go="dojo">Dojo</button>
        <button class="btn" data-go="matrix">Matrices</button>
      </div>
      <div class="topic-list">${topics}</div>
      <div class="card" style="margin-top:16px">${domainMap(d.id)}</div>`
    );
  }

  function domainMap(id) {
    const maps = {
      design: "IAM + CMEK + DLP + location + VPC-SC wrap the platform. Datastream / DMS / DTS / Appliance move data in. Separate prod projects.",
      ingest: "Pub/Sub → Dataflow (windows). GCS → Dataform or Dataflow. Spark → Dataproc. Composer/Workflows above. Sinks: BigQuery / GCS / Bigtable.",
      store: "SQL seconds → BigQuery. Files → GCS + BigLake. ms time series → Bigtable. Global SQL → Spanner. Regional OLTP → Cloud SQL / AlloyDB.",
      analyze: "Partition/cluster → materialized views / BI Engine → Looker. Side door: BQML and embeddings/RAG prep. Share via Analytics Hub.",
      operate: "DAG schedules jobs. Reservations isolate interactive vs batch. Monitoring + INFORMATION_SCHEMA. Quarantine bad files. Multi-region failover."
    };
    return `<p class="kicker">Map</p><h3>How this domain thinks</h3><p>${maps[id]}</p>`;
  }

  function renderTopic(domainId, topicId) {
    const d = domainById(domainId);
    const t = d && d.topics.find((x) => x.id === topicId);
    if (!t) return renderDomain(domainId);
    view.innerHTML = layout(
      d.title,
      t.title,
      t.summary,
      `
      <div class="card">
        ${t.body.map((p) => `<p style="margin:0 0 12px;color:var(--text)">${p}</p>`).join("")}
        <div class="chips">${t.chips.map((c) => `<span class="chip">${c}</span>`).join("")}</div>
        <p style="margin-top:16px">
          <button class="btn primary" id="done">Mark complete +15 XP</button>
          <button class="btn" data-go="cards/${d.id}">Drill cards</button>
          <button class="btn" data-go="domain/${d.id}">Back to domain</button>
        </p>
      </div>`
    );
    $("#done").onclick = () => {
      const res = S.completeTopic(d.id, t.id);
      if (res.already) toast("Already counted");
      else toast("+15 XP");
      sidebar();
    };
  }

  function renderAtlas() {
    view.innerHTML = layout(
      "Service atlas",
      "Use this. Not that.",
      "Most items are “which product given a constraint.” Memorize the trap, not the marketing page.",
      `<div class="service-grid">${C.services.map((s) => `
        <div class="svc">
          <h4>${s.name}</h4>
          <div class="use">Use: ${s.use}</div>
          <div class="not">Not: ${s.not}</div>
        </div>`).join("")}</div>`
    );
  }

  function renderMatrix() {
    view.innerHTML = layout(
      "Decision matrices",
      "The exam in four tables",
      "If a question lists constraints, start here before you start hoping.",
      `
      <div class="card" style="margin-bottom:16px">
        <h3>Storage</h3>
        <table class="matrix">
          <tr><th>Need</th><th>Default</th><th>Trap</th></tr>
          <tr><td>Ad-hoc SQL / BI / BQML</td><td>BigQuery</td><td>Not millisecond OLTP</td></tr>
          <tr><td>Objects / lake / landing</td><td>Cloud Storage + lifecycle</td><td>Not a query engine alone</td></tr>
          <tr><td>Query files in place</td><td>BigLake</td><td>Not an app database</td></tr>
          <tr><td>Huge QPS time series</td><td>Bigtable</td><td>Time-first row keys hotspot</td></tr>
          <tr><td>Global relational consistency</td><td>Spanner</td><td>Overkill for a regional 200 GB app</td></tr>
          <tr><td>Regional MySQL/Postgres lift</td><td>Cloud SQL</td><td>Not a petabyte warehouse</td></tr>
          <tr><td>Postgres + heavier analytics</td><td>AlloyDB</td><td>Still not Spanner-global</td></tr>
          <tr><td>Document / mobile state</td><td>Firestore</td><td>Not a click warehouse</td></tr>
          <tr><td>Hot cache</td><td>Memorystore</td><td>Not source of truth</td></tr>
        </table>
      </div>
      <div class="card" style="margin-bottom:16px">
        <h3>Processing</h3>
        <table class="matrix">
          <tr><th>Need</th><th>Default</th><th>Trap</th></tr>
          <tr><td>Windows, event time, exactly-once</td><td>Dataflow / Beam</td><td>Cloud Functions is not a watermark engine</td></tr>
          <tr><td>Existing Spark / Hive</td><td>Dataproc</td><td>Do not rewrite 200 jobs this quarter</td></tr>
          <tr><td>SQL ELT already in BQ</td><td>Dataform</td><td>Not for binary transforms</td></tr>
          <tr><td>Visual ETL / mixed skill</td><td>Data Fusion</td><td>Heavier than Dataform for pure SQL</td></tr>
          <tr><td>Event bus</td><td>Pub/Sub</td><td>At-least-once; not a database</td></tr>
          <tr><td>CDC from Oracle/MySQL/PG</td><td>Datastream</td><td>Not the SaaS marketing connector</td></tr>
        </table>
      </div>
      <div class="grid grid-2">
        <div class="card">
          <h3>Orchestration</h3>
          <table class="matrix">
            <tr><td>Rich Airflow graph</td><td>Composer</td></tr>
            <tr><td>Two or three Google API steps</td><td>Workflows</td></tr>
            <tr><td>Simple SQL estate</td><td>Scheduled queries</td></tr>
            <tr><td>Cron kick</td><td>Cloud Scheduler</td></tr>
          </table>
        </div>
        <div class="card">
          <h3>Migration movers</h3>
          <table class="matrix">
            <tr><td>Continuous CDC</td><td>Datastream</td></tr>
            <tr><td>Move the database runtime</td><td>Database Migration Service</td></tr>
            <tr><td>SaaS / Google product → BQ</td><td>BigQuery Data Transfer Service</td></tr>
            <tr><td>Object copies / S3</td><td>Storage Transfer Service</td></tr>
            <tr><td>WAN cannot finish</td><td>Transfer Appliance</td></tr>
          </table>
        </div>
      </div>`
    );
  }

  function renderDojo() {
    const items = window.PDE_DOJO;
    let i = 0;
    function draw() {
      const it = items[i];
      const cleared = S.get().dojoCleared.includes(it.id);
      view.innerHTML = layout(
        `Dojo ${i + 1}/${items.length}`,
        it.title,
        it.setup,
        `
        <div class="card">
          ${it.options.map((o, idx) => `<button class="choice" data-i="${idx}">${o}</button>`).join("")}
          <div class="explain" id="ex" style="display:none"></div>
          <p style="margin-top:12px">
            <button class="btn" id="prev">Prev</button>
            <button class="btn" id="next">Next</button>
            ${cleared ? "<span class='pill'>cleared</span>" : ""}
          </p>
        </div>`
      );
      view.querySelectorAll(".choice").forEach((b) => {
        b.onclick = () => {
          const idx = Number(b.dataset.i);
          const ok = idx === it.answer;
          b.classList.add(ok ? "correct" : "wrong");
          view.querySelectorAll(".choice")[it.answer].classList.add("correct");
          $("#ex").style.display = "block";
          $("#ex").textContent = it.why;
          if (ok) {
            S.clearDojo(it.id, true);
            toast("+XP dojo");
            sidebar();
          }
        };
      });
      $("#prev").onclick = () => { i = (i + items.length - 1) % items.length; draw(); };
      $("#next").onclick = () => { i = (i + 1) % items.length; draw(); };
    }
    draw();
  }

  function renderCards(domainId) {
    const id = domainId || "design";
    const deck = window.PDE_CARDS[id] || window.PDE_CARDS.design;
    let i = 0;
    let flipped = false;
    let seen = 0;
    function draw() {
      const [q, a] = deck[i];
      view.innerHTML = layout(
        "Flashcards",
        domainById(id).title,
        "Space flips. Get 8 cards in for the daily quest.",
        `
        <div class="chips" style="margin-bottom:12px">${C.domains.map((d) =>
          `<button class="btn ${d.id === id ? "primary" : ""}" data-go="cards/${d.id}">${d.title.split(" ")[0]}</button>`
        ).join("")}</div>
        <div class="card flash" id="card">
          <div>
            <p class="kicker">${flipped ? "Answer" : "Prompt"} · ${i + 1}/${deck.length}</p>
            <div class="${flipped ? "a" : "q"}">${flipped ? a : q}</div>
          </div>
        </div>
        <p style="margin-top:12px">
          <button class="btn" id="miss">Missed</button>
          <button class="btn primary" id="knew">Knew</button>
        </p>`
      );
      $("#card").onclick = () => { flipped = !flipped; draw(); };
      const next = () => {
        seen += 1;
        S.bumpQuest("cards", 1);
        i = (i + 1) % deck.length;
        flipped = false;
        if (seen === 8) toast("Quest cards moving");
        draw();
      };
      $("#knew").onclick = next;
      $("#miss").onclick = next;
    }
    draw();
  }

  function renderQuiz(domainId) {
    const questions = window.PDE_QUIZZES[domainId];
    if (!questions) return renderHome();
    let i = 0;
    let correct = 0;
    let combo = 0;
    function end() {
      const score = correct / questions.length;
      S.recordQuiz(domainId, score);
      if (score >= 0.8) S.addXP(40);
      sidebar();
      view.innerHTML = layout(
        "Quiz result",
        domainById(domainId).title,
        `${correct}/${questions.length} · ${Math.round(score * 100)}%`,
        `<div class="card"><p>${score >= 0.8 ? "Pass line hit. That is Sharpshooter territory." : "Below 80%. Read the why on every miss and retry."}</p>
         <button class="btn primary" data-go="quiz/${domainId}">Retry</button>
         <button class="btn" data-go="domain/${domainId}">Domain</button></div>`
      );
    }
    function draw() {
      if (i >= questions.length) return end();
      const item = questions[i];
      view.innerHTML = layout(
        `Quiz ${i + 1}/${questions.length}`,
        domainById(domainId).title,
        "Real exam also uses multi-select. These items are single-best on purpose.",
        `<div class="card">
          <p class="quiz-q">${item.q}</p>
          ${item.choices.map((c, idx) => `<button class="choice" data-i="${idx}">${c}</button>`).join("")}
          <div class="explain" id="ex" style="display:none"></div>
          <p style="margin-top:12px"><button class="btn primary" id="nx" style="display:none">Next</button></p>
        </div>`
      );
      let locked = false;
      view.querySelectorAll(".choice").forEach((b) => {
        b.onclick = () => {
          if (locked) return;
          locked = true;
          const idx = Number(b.dataset.i);
          const ok = idx === item.answer;
          view.querySelectorAll(".choice")[item.answer].classList.add("correct");
          if (!ok) b.classList.add("wrong");
          $("#ex").style.display = "block";
          $("#ex").textContent = item.why;
          $("#nx").style.display = "inline-block";
          S.bumpQuest("quiz", 1);
          if (ok) {
            correct += 1;
            combo += 1;
            S.addXP(8);
            if (combo === 5) { S.addXP(10); toast("COMBO ×5 +10 XP"); }
          } else {
            combo = 0;
            S.addXP(2);
          }
          sidebar();
        };
      });
      $("#nx").onclick = () => { i += 1; draw(); };
    }
    draw();
  }

  function renderExam() {
    const bank = [];
    const plan = [
      ["ingest", 6], ["design", 5], ["store", 5], ["operate", 4], ["analyze", 5]
    ];
    plan.forEach(([id, n]) => {
      const qs = window.PDE_QUIZZES[id].slice();
      for (let i = 0; i < n && qs.length; i++) {
        const q = qs.splice(Math.floor(Math.random() * qs.length), 1)[0];
        bank.push({ ...q, domain: id });
      }
    });
    let i = 0;
    let correct = 0;
    const started = Date.now();
    let remain = 36 * 60;
    let timer;
    const answers = [];

    function tick() {
      remain -= 1;
      const el = $("#clock");
      if (el) el.textContent = Math.floor(remain / 60) + ":" + String(remain % 60).padStart(2, "0");
      if (remain <= 0) finish();
    }

    function finish() {
      clearInterval(timer);
      const score = correct / bank.length;
      S.recordExam(score, Math.round((Date.now() - started) / 1000), bank.length);
      sidebar();
      toast("Mock saved");
      view.innerHTML = layout(
        "Mock complete",
        Math.round(score * 100) + "%",
        score >= 0.8 ? "If Skills labs are also done, this is book-the-exam territory." : "Patch the weak domain, then sit another mock.",
        `<div class="card"><p>${correct}/${bank.length} in exam conditions.</p>
         <button class="btn primary" data-go="exam">Again</button>
         <button class="btn" data-go="home">Home</button></div>`
      );
    }

    function draw() {
      const item = bank[i];
      view.innerHTML = layout(
        `Mock ${i + 1}/${bank.length}`,
        "Timed drill",
        "36 minutes for 25 items. Flag nothing — decide.",
        `<div class="card">
          <p class="kicker">${item.domain} · <span id="clock"></span></p>
          <p class="quiz-q">${item.q}</p>
          ${item.choices.map((c, idx) => `<button class="choice" data-i="${idx}">${c}</button>`).join("")}
        </div>`
      );
      tick();
      view.querySelectorAll(".choice").forEach((b) => {
        b.onclick = () => {
          const idx = Number(b.dataset.i);
          if (idx === item.answer) correct += 1;
          answers.push(idx);
          i += 1;
          if (i >= bank.length) finish();
          else draw();
        };
      });
    }
    draw();
    timer = setInterval(tick, 1000);
  }

  function renderLabs(which) {
    const map = {
      storage: "Storage wizard",
      windows: "Windowing lab",
      rowkey: "Bigtable row keys",
      pipeline: "Pipeline builder",
      iam: "IAM inheritance"
    };
    if (!which) {
      view.innerHTML = layout(
        "Labs",
        "Five toys that match exam traps",
        "Do each once. Then you can explain them out loud.",
        `<div class="grid grid-2">
          ${Object.entries(map).map(([k, v]) => `<div class="card" data-go="lab/${k}" style="cursor:pointer"><h3>${v}</h3><p>${S.get().labsDone.includes(k) ? "Completed" : "Not done"}</p></div>`).join("")}
        </div>`
      );
      return;
    }
    view.innerHTML = layout("Lab", map[which] || which, "", `<div id="lab-root"></div>`);
    const fn = window.PDE_WIDGETS[which];
    if (!fn) return;
    fn($("#lab-root"), (id) => {
      S.completeLab(id);
      toast("+20 XP lab");
      sidebar();
    });
  }

  function renderPath() {
    const weeks = [
      ["Week 1 — Design + storage", "Finish design topics. Storage wizard + IAM lab. Storage matrix until recitable."],
      ["Week 2 — Batch + migrations", "Ingest planning + build (batch half). Datastream vs DMS vs Appliance."],
      ["Week 3 — Streaming", "Windowing lab. Pub/Sub + Dataflow path. Ingest quiz."],
      ["Week 4 — Analyze + platform", "Analyze topics. Dataplex / Analytics Hub / BQML / RAG prep. Composer vs Workflows."],
      ["Week 5 — Operate + first mock", "Operate topics. Reservations, INFORMATION_SCHEMA, failover. First timed mock."],
      ["Week 6 — Weak domains only", "No new products. Two mocks. Book only if the gate is green."]
    ];
    view.innerHTML = layout(
      "Study path",
      "Six weeks at 20 hours",
      "Skills path labs stay mandatory. This OS trains the decision layer.",
      `<div class="topic-list">${weeks.map((w, idx) => `
        <div class="topic"><div class="check">${idx + 1}</div><div><strong>${w[0]}</strong><p>${w[1]}</p></div></div>`
      ).join("")}</div>
      <div class="card" style="margin-top:16px">
        <h3>Readiness gate</h3>
        <p>Official samples feel obvious. Two mocks ~80%+. You can explain late data, row keys, partition/cluster/slots, and IAM/DLP/residency with no notes.</p>
      </div>`
    );
  }

  function renderBadges() {
    const st = S.get();
    view.innerHTML = layout(
      "Trophy case",
      "Badges",
      "Earn them by doing the work. Nothing is cosmetic except the toast.",
      `<div class="badge-grid">${C.badges.map((b) => {
        const earned = st.badges[b.id];
        return `<div class="badge ${earned ? "earned" : ""}"><strong>${b.name}</strong><p>${earned ? earned.slice(0, 10) : b.hint}</p></div>`;
      }).join("")}</div>`
    );
  }

  function renderGuide() {
    view.innerHTML = layout(
      "Field guide",
      "How to sit the exam",
      "This site is not a dump and not a substitute for Google Skills labs.",
      `<div class="card">
        <p>Official page: <a href="https://cloud.google.com/learn/certification/data-engineer/" target="_blank" rel="noopener">Professional Data Engineer</a></p>
        <p>Exam guide PDF: <a href="https://services.google.com/fh/files/misc/professional_data_engineer_exam_guide_english.pdf" target="_blank" rel="noopener">standard guide</a></p>
        <p>Skills path: <a href="https://www.cloudskillsboost.google/paths/16" target="_blank" rel="noopener">path 16</a></p>
        <h3 style="margin-top:16px">Exam-day</h3>
        <p>Extract constraints first (latency, region, PII, existing Spark, exactly-once). Prefer managed/serverless unless the estate forces Dataproc. Multi-select means all required pieces. Guess — no penalty. Flag at 2 minutes and move.</p>
      </div>`
    );
  }

  function route() {
    S.touch();
    sidebar();
    const raw = (location.hash || "#/home").replace(/^#\/?/, "") || "home";
    S.get().lastRoute = raw;
    S.save();
    const [name, a, b] = raw.split("/");
    const table = {
      home: renderHome,
      atlas: renderAtlas,
      matrix: renderMatrix,
      dojo: renderDojo,
      exam: renderExam,
      path: renderPath,
      badges: renderBadges,
      guide: renderGuide
    };
    if (name === "domain") return renderDomain(a);
    if (name === "topic") return renderTopic(a, b);
    if (name === "cards") return renderCards(a);
    if (name === "quiz") return renderQuiz(a);
    if (name === "lab") return renderLabs(a);
    (table[name] || renderHome)();
  }

  function bindNav() {
    document.body.addEventListener("click", (e) => {
      const hit = e.target.closest("[data-go]");
      if (hit) {
        e.preventDefault();
        go(hit.dataset.go);
      }
    });
    window.addEventListener("hashchange", route);
  }

  function init() {
    view = $("#view");
    S.load();
    bindNav();
    if (!location.hash) location.hash = "#/home";
    route();
  }

  return { init, go };
})();

document.addEventListener("DOMContentLoaded", () => window.PDE_APP.init());
