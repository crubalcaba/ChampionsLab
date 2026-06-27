// ═══════════════════════════════════════════════════════════════════════════════
// CHAMPIONS LAB - STRATEGY TREE & INSIGHTS KOREAN TRANSLATION
// Post-processes English engine output into Korean for display.
// The engine generates the tree in English (logic relies on English strings),
// then this module translates all labels/details/branchLabels for the UI.
// ═══════════════════════════════════════════════════════════════════════════════

import type { StrategyTree, StrategyNode } from "./strategy-tree";

type TM = (name: string) => string; // translate move name
type TA = (name: string) => string; // translate ability name

// ── KOREAN PARTICLE HELPERS ──────────────────────────────────────────────────
// Korean postpositional particles change form depending on whether the
// preceding word ends with a final consonant (batchim) or a vowel.

function hasBatchim(text: string): boolean {
  const code = text.charCodeAt(text.length - 1);
  return code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 !== 0;
}

function particle(text: string, withBatchim: string, withoutBatchim: string): string {
  return hasBatchim(text) ? withBatchim : withoutBatchim;
}

/** Returns "으로" after a consonant (except ㄹ) and "로" after a vowel or ㄹ. */
function directionParticle(text: string): string {
  const code = text.charCodeAt(text.length - 1);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const jongseong = (code - 0xAC00) % 28;
    if (jongseong === 0 || jongseong === 8) return "로"; // vowel ending or ㄹ final
  }
  return "으로";
}

// ── LABEL TRANSLATION ────────────────────────────────────────────────────────

function translateLabel(label: string, tm: TM, _ta: TA): string {
  // Exact matches
  const exact: Record<string, string> = {
    "Turn 1": "1턴",
    "Turn 2": "2턴",
    "Turn 3+": "3턴+",
    "Intimidate partially blocked": "위협 부분 차단",
    "Opponent Intimidate: -1 Atk": "상대 위협: 공격 -1",
    "No speed control  -  opponent moves first!": "스피드 컨트롤 없음  –  상대가 먼저 움직임!",
    "Both attack  -  you outspeed": "양쪽 공격  –  우리가 선공",
    "Continue offense or pivot?": "공격 지속 또는 교체?",
  };
  if (exact[label]) return exact[label];

  let m: RegExpMatchArray | null;

  // Lead: {name} + {name}
  m = label.match(/^Lead: (.+) \+ (.+)$/);
  if (m) return `리드: ${m[1]} + ${m[2]}`;

  // vs {name} + {name}
  m = label.match(/^vs (.+) \+ (.+)$/);
  if (m) return `vs ${m[1]} + ${m[2]}`;

  // TAILWIND: N Turns left
  m = label.match(/^TAILWIND: (\d+) Turns left$/);
  if (m) return `순풍: ${m[1]}턴 남음`;

  // TRICK ROOM: N Turns left
  m = label.match(/^TRICK ROOM: (\d+) Turns left$/);
  if (m) return `트릭룸: ${m[1]}턴 남음`;

  // {WEATHER} persists ({name} slower → sets last)
  m = label.match(/^(.+) persists \((.+) slower → sets last\)$/);
  if (m) return `${m[1]} 유지 (${m[2]}${particle(m[2], "이", "가")} 느려서 나중에 발동)`;

  // {WEATHER} overrides ({name} slower)
  m = label.match(/^(.+) overrides \((.+) slower\)$/);
  if (m) return `${m[1]} 덮어씀 (${m[2]}${particle(m[2], "이", "가")} 느림)`;

  // {NAME} TERRAIN: 5 Turns
  m = label.match(/^(.+) TERRAIN: 5 Turns$/);
  if (m) return `${m[1]} 필드: 5턴`;

  // {WEATHER}: 5 Turns
  m = label.match(/^(.+): 5 Turns$/);
  if (m) return `${m[1]}: 5턴`;

  // {name} threatens Fake Out → {name}
  m = label.match(/^(.+) threatens Fake Out → (.+)$/);
  if (m) return `${m[1]}${particle(m[1], "이", "가")} ${m[2]}에게 ${tm("Fake Out")} 위협`;

  // {name} may Fake Out {name}
  m = label.match(/^(.+) may Fake Out (.+)$/);
  if (m) return `${m[1]}${particle(m[1], "이", "가")} ${m[2]}에게 ${tm("Fake Out")} 가능`;

  // {name} may set Trick Room
  m = label.match(/^(.+) may set Trick Room$/);
  if (m) return `${m[1]}${particle(m[1], "이", "가")} ${tm("Trick Room")} 설치 가능`;

  // {name} gets flinched
  m = label.match(/^(.+) gets flinched$/);
  if (m) return `${m[1]} 풀죽음`;

  // ⚠ {name} redirects single-target attacks
  m = label.match(/^⚠ (.+) redirects single-target attacks$/);
  if (m) return `⚠ ${m[1]}${particle(m[1], "이", "가")} 단일 대상 공격 끌어당김`;

  // Did {name} set {move} Turn 1?
  m = label.match(/^Did (.+) set (.+) Turn 1\?$/);
  if (m) return `1턴에 ${m[1]}${particle(m[1], "이", "가")} ${tm(m[2])} 설치했는가?`;

  // Both attack under {move}
  m = label.match(/^Both attack under (.+)$/);
  if (m) return `양쪽 모두 ${tm(m[1])} 아래에서 공격`;

  // Double into {name|threats}
  m = label.match(/^Double into (.+)$/);
  if (m) return m[1] === "threats" ? "위협에 더블어택" : `${m[1]}에 더블어택`;

  // Bring: {names}
  m = label.match(/^Bring: (.+)$/);
  if (m) return `투입: ${m[1]}`;

  // Focus {name}
  m = label.match(/^Focus (.+)$/);
  if (m) return `${m[1]} 집중`;

  // Outcome labels
  if (label.startsWith("Favorable")) return "유리  –  주도권 유지 및 효율적 교체";
  if (label.startsWith("Close matchup")) return "박빙  –  실수 금물, 핵심 포켓몬 보호";
  if (label.startsWith("Uphill battle")) return "역전 필요  –  모멘텀을 위한 초반 KO 필요";
  if (label.startsWith("Tough matchup")) return "불리  –  다른 리드나 서프라이즈 고려";

  // Action pattern: "{name}: {action}" — must come last (broadest match)
  const colonIdx = label.indexOf(": ");
  if (colonIdx > 0 && !label.startsWith("Opponent") && !label.startsWith("TAILWIND") && !label.startsWith("TRICK ROOM")) {
    return translateActionLabel(label, colonIdx, tm);
  }

  return label;
}

function translateActionLabel(label: string, colonIdx: number, tm: TM): string {
  const name = label.substring(0, colonIdx);
  const action = label.substring(colonIdx + 2);

  if (action === "attacks") return `${name}: 공격`;

  // {name}: {move} to finish
  if (action.endsWith(" to finish")) {
    const moveName = action.replace(" to finish", "");
    const translated = tm(moveName);
    return `${name}: ${translated}${directionParticle(translated)} 마무리`;
  }

  // {name}: Protect · Switch {rest}
  const protectSwitch = action.match(/^Protect · Switch (.+)$/);
  if (protectSwitch) return `${name}: ${tm("Protect")} · Switch ${protectSwitch[1]}`;

  // {name}: {move}? (optional setup)
  if (action.endsWith("?")) {
    const moveName = action.slice(0, -1);
    return `${name}: ${tm(moveName)}?`;
  }

  // {name}: {move} → both foes
  if (action.endsWith(" → both foes")) {
    const moveName = action.replace(" → both foes", "");
    return `${name}: ${tm(moveName)} → 상대 전체`;
  }

  // {name}: {move} → {target}
  const arrowIdx = action.indexOf(" → ");
  if (arrowIdx > 0) {
    const moveName = action.substring(0, arrowIdx);
    const target = action.substring(arrowIdx + 3);
    return `${name}: ${tm(moveName)} → ${target}`;
  }

  // {name}: {move} (simple)
  return `${name}: ${tm(action)}`;
}

// ── DETAIL TRANSLATION ───────────────────────────────────────────────────────

function translateFieldNote(note: string): string {
  if (note === "No entry effects") return "입장 효과 없음";
  if (note === "Intimidate on entry") return "입장 시 위협";
  const terrainM = note.match(/^Sets (.+) terrain$/);
  if (terrainM) return `${terrainM[1]} 필드 설치`;
  const weatherM = note.match(/^Sets (.+)$/);
  if (weatherM) return `${weatherM[1]} 발동`;
  return note;
}

function translateReason(reason: string): string {
  switch (reason) {
    case "block setup": return "셋업 저지";
    case "remove redirection": return "딜레기 제거";
    case "biggest threat": return "최대 위협";
    default: return reason;
  }
}

function translateDetail(detail: string | undefined, tm: TM, ta: TA): string | undefined {
  if (!detail) return undefined;

  // ── EXACT MATCHES (no interpolation needed) ──
  const exact: Record<string, string> = {
    "Most likely lead": "가장 가능성 높은 리드",
    "Alternative lead": "대체 리드",
    "Possible lead": "가능한 리드",
    "Boosts your moves": "자기 편 기술 강화",
    "Boosts opponent's moves": "상대 편 기술 강화",
    "Maintain tempo": "템포 유지",
    "Contest speed advantage": "선제권 다투기",
    "Close out the game": "게임 마무리",
    "Full offense": "전력 공격",
    "Double your side's speed for 4 turns": "4턴 동안 자기 편 스피드 2배",
    "Reverse speed for 5 turns  -  your slow mons move first": "5턴 동안 스피드 역전  –  느린 포켓몬이 먼저 움직임",
    "Redirect attacks to protect partner": "공격을 끌어당겨 파트너 보호",
    "Boost while partner covers": "파트너가 커버하는 동안 강화",
    "Draw all single-target attacks  -  protect partner": "모든 단일 공격 유도  –  파트너 보호",
    "Safely boost while partner redirects": "파트너가 딜레기 역할 하는 동안 안전하게 강화",
    "Your side doubles speed for 4 turns total": "자기 편 스피드 4턴간 2배",
    "Slower Pokémon move first": "느린 포켓몬이 먼저 움직임",
    "Double speed for 4 turns": "4턴간 스피드 2배",
    "Reverse speed for 5 turns": "5턴간 스피드 역전",
    "KO the TR setter before it moves (-7 priority)": "TR 세터가 움직이기 전 KO (우선도 -7)",
    "Stall a turn and bring in a better matchup": "한 턴 버티고 더 나은 매치업 투입",
    "Under speed control, consider boosting for a sweep": "스피드 컨트롤 하에서 스윕을 위해 강화 고려",
    "Cover while partner sets up": "파트너가 세팅하는 동안 커버",
    "Set speed after turn 1 disruption": "1턴 방해 후 스피드 컨트롤",
    "Continue pressing advantage": "유리한 상황 지속",
    "Depends on which Turn 1 branch was taken": "1턴에 어떤 분기를 탔는지에 따라 달라짐",
    "Delayed from Turn 1  -  set up now": "1턴에서 지연됨  –  지금 세팅",
  };
  if (exact[detail]) return exact[detail];

  // ── EXACT MATCHES REQUIRING tm/ta ──
  if (detail === "Counters Tailwind by reversing speed") return `스피드를 역전시켜 ${tm("Tailwind")} 카운터`;
  if (detail === "Consider bringing a Tailwind/Trick Room user or Protect to survive turn 1") return `1턴을 버티기 위해 ${tm("Tailwind")}/${tm("Trick Room")} 유저나 ${tm("Protect")} 투입 고려`;
  if (detail === "Depends on whether opponent Faked Out") {
    const move = tm("Fake Out");
    return `상대가 ${move}${particle(move, "을", "를")} 썼는지에 따라 달라짐`;
  }
  if (detail === "Tailwind active  -  you outspeed") return `${tm("Tailwind")} 발동 중  –  선제권 확보`;
  if (detail === "Trick Room active  -  slowest moves first") return `${tm("Trick Room")} 발동 중  –  느린 포켓몬이 먼저`;

  let m: RegExpMatchArray | null;

  // ── REGEX PATTERNS ──

  // Win Rate · field notes
  m = detail.match(/^(\d+)% Win Rate · (.+)$/);
  if (m) {
    const notes = m[2].split(" · ").map(translateFieldNote).join(" · ");
    return `승률: ${m[1]}% · ${notes}`;
  }

  // Speed order
  m = detail.match(/^Speed order: (.+)$/);
  if (m) return `스피드 순서: ${m[1]}`;

  // Weather details
  m = detail.match(/^Your (.+) is active  -  5 turns$/);
  if (m) return `자기 편 ${m[1]} 발동 중  –  5턴`;

  m = detail.match(/^Opponent's (.+) is active\. Consider manual weather reset\.$/);
  if (m) return `상대의 ${m[1]} 발동 중. 수동 날씨 리셋 고려.`;

  m = detail.match(/^Set by (.+) on entry$/);
  if (m) return `${m[1]} 입장 시 발동`;

  // Intimidate
  m = detail.match(/^(.+)'s (.+) blocks Intimidate$/);
  if (m) {
    const ability = ta(m[2]);
    return `${m[1]}의 ${ability}${particle(ability, "이", "가")} 위협을 막음`;
  }

  m = detail.match(/^(.+) lowers your physical damage$/);
  if (m) return `${m[1]}${particle(m[1], "이", "가")} 물리 데미지 감소`;

  // Fake Out details
  m = detail.match(/^May block your (.+)  -  choose your play$/);
  if (m) {
    const move = tm(m[1]);
    return `${move}${particle(move, "을", "를")} 막을 수 있음  –  플레이 선택`;
  }

  m = detail.match(/^Flinch to (.+)  -  partner sets up freely$/);
  if (m) {
    const reason = translateReason(m[1]);
    return `${reason}${particle(reason, "을", "를")} 위해 풀죽음  –  파트너 자유롭게 세팅`;
  }

  m = detail.match(/^Flinch to (.+) \(priority \+3, always goes first\)$/);
  if (m) {
    const reason = translateReason(m[1]);
    return `${reason}${particle(reason, "을", "를")} 위해 풀죽음 (우선도 +3, 항상 선공)`;
  }

  m = detail.match(/^Partner Protects to block Fake Out  -  (.+) delayed to Turn 2$/);
  if (m) return `파트너가 ${tm("Fake Out")} 막기 위해 ${tm("Protect")}  –  ${tm(m[1])} 2턴으로 지연`;

  m = detail.match(/^Block opponent's Fake Out  -  set up (.+) next turn$/);
  if (m) return `상대 ${tm("Fake Out")} 막기  –  다음 턴 ${tm(m[1])} 세팅`;

  m = detail.match(/^No Protect  -  (.+) delayed to Turn 2\. (.+) still flinches (.+)\.$/);
  if (m) return `${tm("Protect")} 없음  –  ${tm(m[1])} 2턴으로 지연. ${m[2]}${particle(m[2], "이", "가")} 여전히 ${m[3]} 풀죽게 함`;

  m = detail.match(/^Threatens to block your (.+)$/);
  if (m) {
    const move = tm(m[1]);
    return `${move}${particle(move, "을", "를")} 막기 위협`;
  }

  m = detail.match(/^Block Fake Out  -  set (.+) Turn 2$/);
  if (m) return `${tm("Fake Out")} 막기  –  2턴에 ${tm(m[1])} 세팅`;

  m = detail.match(/^(.+) delayed to Turn 2$/);
  if (m) return `${tm(m[1])} 2턴으로 지연`;

  m = detail.match(/^Ignore TR threat  -  deal maximum damage\. Counter-TR later if needed\.$/);
  if (m) return "TR 위협 무시  –  최대 데미지. 필요 시 후반 TR 카운터.";

  // Turn 2 post-Fake Out
  m = detail.match(/^Fake Out used  -  switch to offense$/);
  if (m) return `${tm("Fake Out")} 사용됨  –  공격으로 전환`;

  m = detail.match(/^You outspeed  -  full offense$/);
  if (m) return "선제권 확보  –  전력 공격";

  m = detail.match(/^Press advantage under (.+)$/);
  if (m) return `${tm(m[1])} 아래에서 유리함 공략`;

  // Endgame
  m = detail.match(/^(.+) has best coverage vs opponent's remaining team$/);
  if (m) return `${m[1]}${particle(m[1], "이", "가")} 상대 남은 팀 상대로 커버리지 최고`;

  m = detail.match(/^Priority \+(\d+)  -  pick off weakened targets$/);
  if (m) return `우선도 +${m[1]}  –  약한 타겟 처리`;

  // Compound attack detail: "{name}: {move} + {name}: {move}"
  m = detail.match(/^(.+): (.+) \+ (.+): (.+)$/);
  if (m) {
    const m1 = m[2] === "attacks" ? "공격" : tm(m[2]);
    const m2 = m[4] === "attacks" ? "공격" : tm(m[4]);
    return `${m[1]}: ${m1} + ${m[3]}: ${m2}`;
  }

  // ── SUBSTRING REPLACEMENTS for composite details ──
  let result = detail;
  result = result.replace("Super effective! ", "효과가 굉장함! ");
  result = result.replace("Focus fire! ", "집중 공격! ");
  result = result.replace("Free to attack while partner absorbs hits", "파트너가 공격을 받는 동안 자유롭게 공격");
  result = result.replace(/(\d+) BP (.+)-type$/, "$1위력 $2타입");
  result = result.replace(/(\d+) BP$/, "$1위력");
  return result;
}

// ── BRANCH LABEL TRANSLATION ────────────────────────────────────────────────

function translateBranchLabel(label: string | undefined, tm: TM): string | undefined {
  if (!label) return undefined;

  const exact: Record<string, string> = {
    "Scenario 1": "시나리오 1",
    "Scenario 2": "시나리오 2",
    "Scenario 3": "시나리오 3",
    "Read no Fake Out": "페이크아웃 없음",
    "Protect": tm("Protect"),
    "No Protect": `${tm("Protect")} 없음`,
    "Prevent TR": "TR 방지",
    "Press damage": "데미지 압박",
    "Setup went up": "셋업 성공",
    "Setup delayed": "셋업 지연",
    "Offense": "공격",
    "Pivot": "교체",
    "Setup": "셋업",
    "Aggro": "공격적",
    "We outspeed": "우리가 먼저",
    "If we outspeed": "우리가 선제권 가지면",
    "They outspeed": "상대가 먼저",
    "If they outspeed": "상대가 선제권 가지면",
  };
  if (exact[label]) return exact[label];

  // {move} goes up
  const m = label.match(/^(.+) goes up$/);
  if (m) return `${tm(m[1])} 발동`;

  return label;
}

// ── ARCHETYPE TRANSLATION ───────────────────────────────────────────────────

function translateArchetype(archetype: string): string {
  const translations: Record<string, string> = {
    "Rain team with Drizzle setter and Swift Swim sweepers for speed dominance.":
      "비 팀: Drizzle 세터와 Swift Swim 스위퍼로 스피드 지배.",
    "Sun team with Drought setter and Chlorophyll sweepers for offensive pressure.":
      "쾌청 팀: Drought 세터와 Chlorophyll 스위퍼로 공격 압박.",
    "Sand team with Sand Stream and physical attackers boosted by sandstorm.":
      "모래바람 팀: Sand Stream과 모래바람으로 강화된 물리 공격수.",
    "Dedicated Trick Room with multiple setters and slow powerhouses.":
      "전형 트릭룸: 다수 세터와 느린 파워하우스.",
    "Trick Room mode available with slow attackers to abuse reversed speed.":
      "트릭룸 모드 사용 가능: 역전 스피드를 노리는 느린 공격수.",
    "Flexible team with Trick Room as an option for specific matchups.":
      "유연한 팀: 특정 매치업용 트릭룸 옵션 보유.",
    "Tailwind-based speed control to let moderate-speed attackers outpace threats.":
      "순풍 기반 스피드 컨트롤: 중간 스피드 공격수가 위협을 앞지르게 함.",
    "All-out offense with fast, powerful attackers and minimal defensive play.":
      "전력 공격: 빠르고 강력한 공격수, 최소한의 방어.",
    "Balanced team with offensive, defensive, and support options.":
      "밸런스 팀: 공격, 방어, 서포트 옵션 고루 갖춤.",
    "Collection of individually strong Pokémon with general type synergy.":
      "개별적으로 강한 포켓몬의 집합: 기본적인 타입 시너지.",
  };
  if (translations[archetype]) return translations[archetype];

  // Fallback: "{archetype} team"
  const m = archetype.match(/^(.+) team$/);
  if (m) {
    const archetypeTranslations: Record<string, string> = {
      rain: "비", sun: "쾌청", sand: "모래바람",
      "trick-room": "트릭룸", "hard-trick-room": "하드 트릭룸",
      tailwind: "순풍", "hyper-offense": "하이퍼 오펜스",
      balance: "밸런스", goodstuffs: "굿스터프",
    };
    const t = archetypeTranslations[m[1]] ?? m[1];
    return `${t} 팀`;
  }

  return archetype;
}

// ── WIN CONDITION TRANSLATION ───────────────────────────────────────────────

function translateWinCondition(wc: string, tm: TM): string {
  const exact: Record<string, string> = {
    "Dominate with rain-boosted Water moves + Swift Swim speed":
      "비 강화 물 기술 + 스위프트스윔 스피드로 지배",
    "Overwhelm with sun-boosted Fire moves + Chlorophyll speed":
      "쾌청 강화 불꽃 기술 + 클로로필 스피드로 압도",
    "Chip with sandstorm + Sand Rush physical sweeping":
      "모래바람 + 샌드러시 물리 스윕으로 닳게 하기",
    "Maximum turn 1 pressure  -  KO before they set up":
      "1턴 최대 압박  –  상대가 세팅하기 전 KO",
    "Set up safely then sweep  -  protect your booster":
      "안전하게 강화 후 스윕  –  부스터 보호",
    "Disrupt turn 1, establish board control, then overwhelm":
      "1턴 방해, 보드 컨트롤 확립 후 압도",
    "Trade favorably and maintain board advantage":
      "유리한 교환과 보드 우위 유지",
  };
  if (exact[wc]) return exact[wc];

  if (wc === "Set Trick Room and let slow powerhouses sweep")
    return `${tm("Trick Room")} 설치 후 느린 파워하우스로 스윕`;
  if (wc === "Set Tailwind early and outpace with strong attacks")
    return `초반 ${tm("Tailwind")} 설치 후 강력한 공격으로 선제권`;

  let m: RegExpMatchArray | null;

  m = wc.match(/^Control the game under (.+)  -  leverage weather-boosted attacks$/);
  if (m) return `${m[1]} 아래에서 게임 지배  –  날씨 강화 기술 활용`;

  m = wc.match(/^Capitalize on (.+) terrain  -  position to maximize its boost$/);
  if (m) return `${m[1]} 필드 활용  –  부스트 최대화를 위한 포지셔닝`;

  return wc;
}

// ── BACKUP PLAN TRANSLATION ─────────────────────────────────────────────────

function translateBackupPlan(plan: string, tm: TM): string {
  let m: RegExpMatchArray | null;

  m = plan.match(/^If losing speed war, pivot to (.+) for Trick Room mode$/);
  if (m) return `스피드 싸움에서 지면 ${m[1]}${directionParticle(m[1])} 교체해 ${tm("Trick Room")} 모드로 전환`;

  m = plan.match(/^Switch to (.+) to reset weather in your favor$/);
  if (m) return `날씨를 유리하게 리셋하기 위해 ${m[1]}${directionParticle(m[1])} 교체`;

  m = plan.match(/^Cycle (.+) for repeated Intimidate to weaken physical attackers$/);
  if (m) return `반복적인 위협으로 물리 공격수를 약화시키기 위해 ${m[1]} 순환`;

  m = plan.match(/^Pivot to (.+)  -  fresh matchup and momentum reset$/);
  if (m) return `${m[1]}${directionParticle(m[1])} 교체  –  새 매치업과 모멘텀 리셋`;

  if (plan === "Adjust your game plan based on what the opponent reveals")
    return "상대가 보여주는 것에 따라 게임 플랜 조정";

  return plan;
}

// ── TREE WALKER ─────────────────────────────────────────────────────────────

function translateNode(node: StrategyNode, tm: TM, ta: TA): StrategyNode {
  return {
    ...node,
    label: translateLabel(node.label, tm, ta),
    detail: translateDetail(node.detail, tm, ta),
    branchLabel: translateBranchLabel(node.branchLabel, tm),
    children: node.children.map(c => translateNode(c, tm, ta)),
  };
}

// ── EXPORTED: TRANSLATE FULL STRATEGY TREE ──────────────────────────────────

export function translateStrategyTreeKO(
  tree: StrategyTree,
  tm: TM,
  ta: TA,
): StrategyTree {
  return {
    root: translateNode(tree.root, tm, ta),
    archetype: translateArchetype(tree.archetype),
    winCondition: translateWinCondition(tree.winCondition, tm),
    keyThreats: tree.keyThreats, // Pokémon names — no translation needed
    backupPlan: translateBackupPlan(tree.backupPlan, tm),
  };
}

// ── EXPORTED: TRANSLATE BATTLE INSIGHTS ─────────────────────────────────────

function translateInsight(insight: string, tm: TM): string {
  // Exact matches
  if (insight === "Lead with Fake Out + Speed Control for maximum turn 1 pressure")
    return `1턴 최대 압박을 위해 ${tm("Fake Out")} + 스피드 컨트롤로 리드`;
  if (insight === "Lead with Fake Out user to disrupt the opponent's setup")
    return `상대 셋업을 방해하기 위해 ${tm("Fake Out")} 유저로 리드`;
  if (insight === "Prioritize setting up speed control on turn 1")
    return "1턴 스피드 컨트롤 세팅 우선";
  if (insight === "Strong matchup  -  focus on consistent play and don't overextend")
    return "유리한 매치업  –  안정적인 플레이에 집중하고 과도하게 뻗지 말 것";
  if (insight === "Tough matchup  -  look for surprise leads or alternate game plans")
    return "불리한 매치업  –  서프라이즈 리드나 대체 플랜 모색";

  let m: RegExpMatchArray | null;

  // Best leads: {name1} + {name2} ({n}% win rate over {n} battles)
  m = insight.match(/^Best leads: (.+) \+ (.+) \((\d+(?:\.\d+)?)% win rate over (\d+) battles\)$/);
  if (m) return `최고 리드: ${m[1]} + ${m[2]} (${m[4]}전 승률 ${m[3]}%)`;

  // Avoid leading {name1} + {name2} (only {n}%)
  m = insight.match(/^Avoid leading (.+) \+ (.+) \(only (\d+(?:\.\d+)?)%\)$/);
  if (m) return `${m[1]} + ${m[2]} 리드 피하기 (승률 ${m[3]}%)`;

  // Lead choice matters a lot here  -  {n}% gap between best and worst
  m = insight.match(/^Lead choice matters a lot here  -  (\d+(?:\.\d+)?)% gap between best and worst$/);
  if (m) return `리드 선택이 매우 중요  –  최고와 최저의 승률 차 ${m[1]}%`;

  // {name} is your MVP for this matchup (+{n}% win rate when brought)
  m = insight.match(/^(.+) is your MVP for this matchup \(\+(\d+(?:\.\d+)?)% win rate when brought\)$/);
  if (m) return `이 매치업의 MVP는 ${m[1]} (투입 시 승률 +${m[2]}%)`;

  // Consider leaving {name} in the back vs this team ({n}% impact)
  m = insight.match(/^Consider leaving (.+) in the back vs this team \((-?\d+(?:\.\d+)?)% impact\)$/);
  if (m) return `이 팀 상대로 ${m[1]}${particle(m[1], "을", "를")} 뒤에 남겨둘 것 고려 (영향도 ${m[2]}%)`;

  return insight;
}

export function translateInsightsKO(insights: string[], tm: TM): string[] {
  return insights.map(i => translateInsight(i, tm));
}
