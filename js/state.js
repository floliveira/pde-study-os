window.PDE_STATE = (function () {
  const KEY = "pde-study-os-v1";
  const empty = () => ({
    xp: 0,
    lastActiveISO: null,
    streak: 0,
    completedTopics: {},
    quizBest: {},
    dojoCleared: [],
    labsDone: [],
    badges: {},
    examHistory: [],
    lastRoute: "home",
    dailyQuest: null,
    combo: 0
  });

  let data = empty();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = Object.assign(empty(), JSON.parse(raw));
    } catch (e) {
      data = empty();
    }
    touch();
    ensureQuest();
    return data;
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function touch() {
    const t = today();
    if (data.lastActiveISO === t) return;
    if (data.lastActiveISO) {
      const prev = new Date(data.lastActiveISO + "T00:00:00");
      const now = new Date(t + "T00:00:00");
      const diff = (now - prev) / 86400000;
      data.streak = diff === 1 ? (data.streak || 0) + 1 : 1;
    } else {
      data.streak = 1;
    }
    data.lastActiveISO = t;
    if (data.streak >= 3) awardBadge("streak-3");
    save();
  }

  function questTypes() {
    return [
      { type: "topic", label: "Complete 1 topic", target: 1 },
      { type: "cards", label: "Review 8 flashcards", target: 8 },
      { type: "dojo", label: "Clear 1 dojo scenario", target: 1 },
      { type: "quiz", label: "Answer 5 quiz items", target: 5 },
      { type: "lab", label: "Finish any interactive lab", target: 1 }
    ];
  }

  function ensureQuest() {
    const t = today();
    if (data.dailyQuest && data.dailyQuest.date === t) return;
    const idx = Number(t.replace(/-/g, "")) % questTypes().length;
    const q = questTypes()[idx];
    data.dailyQuest = { date: t, type: q.type, label: q.label, target: q.target, progress: 0, claimed: false };
    save();
  }

  function bumpQuest(type, n) {
    ensureQuest();
    const q = data.dailyQuest;
    if (!q || q.type !== type || q.claimed) return;
    q.progress = Math.min(q.target, (q.progress || 0) + (n || 1));
    save();
  }

  function claimQuest() {
    const q = data.dailyQuest;
    if (!q || q.claimed || q.progress < q.target) return 0;
    q.claimed = true;
    addXP(25);
    save();
    return 25;
  }

  function rankFor(xp) {
    const ranks = window.PDE_CONTENT.ranks;
    let current = ranks[0];
    let next = ranks[1] || ranks[0];
    for (let i = 0; i < ranks.length; i++) {
      if (xp >= ranks[i].xp) {
        current = ranks[i];
        next = ranks[i + 1] || ranks[i];
      }
    }
    return { current, next };
  }

  function addXP(n) {
    const before = rankFor(data.xp).current.name;
    data.xp += n;
    save();
    const after = rankFor(data.xp).current.name;
    if (data.xp >= 1600) awardBadge("level-pde");
    return { xp: n, leveled: before !== after, rank: after };
  }

  function awardBadge(id) {
    if (data.badges[id]) return false;
    data.badges[id] = new Date().toISOString();
    save();
    return true;
  }

  function completeTopic(domainId, topicId) {
    const key = domainId + ":" + topicId;
    if (data.completedTopics[key]) return { already: true, xp: 0 };
    data.completedTopics[key] = true;
    bumpQuest("topic", 1);
    const gained = addXP(15);
    awardBadge("first-topic");
    const domain = window.PDE_CONTENT.domains.find((d) => d.id === domainId);
    if (domain && domain.topics.every((t) => data.completedTopics[domainId + ":" + t.id])) {
      awardBadge("all-" + (domainId === "analyze" ? "analyze" : domainId === "operate" ? "operate" : domainId === "store" ? "store" : domainId === "ingest" ? "ingest" : "design"));
    }
    save();
    return gained;
  }

  function recordQuiz(domainId, score, correctStreakEnd) {
    const prev = data.quizBest[domainId] || 0;
    if (score > prev) data.quizBest[domainId] = score;
    if (score >= 0.8) {
      awardBadge("quiz-80");
      const ids = window.PDE_CONTENT.domains.map((d) => d.id);
      if (ids.every((id) => (data.quizBest[id] || 0) >= 0.8)) awardBadge("quiz-all");
    }
    save();
    return score > prev;
  }

  function clearDojo(id, firstTry) {
    if (!data.dojoCleared.includes(id)) data.dojoCleared.push(id);
    bumpQuest("dojo", 1);
    if (data.dojoCleared.length >= 5) awardBadge("dojo-5");
    save();
    return addXP(firstTry ? 12 : 6);
  }

  function completeLab(id) {
    if (!data.labsDone.includes(id)) data.labsDone.push(id);
    bumpQuest("lab", 1);
    save();
    return addXP(20);
  }

  function recordExam(score, seconds, n) {
    data.examHistory.push({ at: new Date().toISOString(), score, seconds, n });
    awardBadge("mock");
    save();
    let xp = addXP(50);
    if (score >= 0.8) addXP(80);
    return xp;
  }

  return {
    load,
    save,
    get: () => data,
    today,
    touch,
    ensureQuest,
    bumpQuest,
    claimQuest,
    rankFor,
    addXP,
    awardBadge,
    completeTopic,
    recordQuiz,
    clearDojo,
    completeLab,
    recordExam
  };
})();
