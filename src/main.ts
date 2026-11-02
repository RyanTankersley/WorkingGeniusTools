import "./styles.css";

type WorkingGenius =
  | "Wonder"
  | "Invention"
  | "Discernment"
  | "Galvanizing"
  | "Enablement"
  | "Tenacity";

type Assessment = "Geniuses" | "Competencies" | "Frustrations";

interface TeamMember {
  FNAME: string;
  LNAME: string;
  Geniuses: WorkingGenius[];
  Competencies: WorkingGenius[];
  Frustrations: WorkingGenius[];
}

interface GeniusDetails {
  short: string;
  description: string;
  tint: string;
}

const geniusTypes: WorkingGenius[] = [
  "Wonder",
  "Invention",
  "Discernment",
  "Galvanizing",
  "Enablement",
  "Tenacity",
];

const geniusDetails: Record<WorkingGenius, GeniusDetails> = {
  Wonder: {
    short: "W",
    description: "Ponders the potential",
    tint: "wonder",
  },
  Invention: {
    short: "I",
    description: "Creates new ideas",
    tint: "invention",
  },
  Discernment: {
    short: "D",
    description: "Finds the right fit",
    tint: "discernment",
  },
  Galvanizing: {
    short: "G",
    description: "Rallies people to act",
    tint: "galvanizing",
  },
  Enablement: {
    short: "E",
    description: "Offers help and support",
    tint: "enablement",
  },
  Tenacity: {
    short: "T",
    description: "Drives work to completion",
    tint: "tenacity",
  },
};

const assessmentDetails: Record<
  Assessment,
  { label: string; singular: string; key: string }
> = {
  Geniuses: { label: "Genius", singular: "Genius", key: "genius" },
  Competencies: { label: "Competency", singular: "Competency", key: "competency" },
  Frustrations: { label: "Frustration", singular: "Frustration", key: "frustration" },
};

const assessments: Assessment[] = ["Geniuses", "Competencies", "Frustrations"];

const app: HTMLDivElement =
  document.querySelector<HTMLDivElement>("#app") ??
  (() => {
    throw new Error("The app root element is missing.");
  })();

let team: TeamMember[] = [];
let selectedMembers = new Set<number>();
let selectedGeniuses = new Set<WorkingGenius>(geniusTypes);
let selectedAssessments = new Set<Assessment>(assessments);
let importError = "";
let importedFileName = "";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function initials(member: TeamMember): string {
  return `${member.FNAME.trim().charAt(0)}${member.LNAME.trim().charAt(0)}`.toUpperCase();
}

function selectedTeam(): TeamMember[] {
  return team.filter((_, index) => selectedMembers.has(index));
}

function memberHasAssessment(
  member: TeamMember,
  assessment: Assessment,
  genius: WorkingGenius,
): boolean {
  return member[assessment].includes(genius);
}

function validateTeam(value: unknown): TeamMember[] {
  if (!Array.isArray(value)) {
    throw new Error("The JSON file must contain an array of team members.");
  }

  const names = new Set<string>();
  return value.map((member: unknown, index: number) => {
    const label = `Team member ${index + 1}`;
    if (typeof member !== "object" || member === null || Array.isArray(member)) {
      throw new Error(`${label} must be an object with FNAME and LNAME strings.`);
    }

    const record = member as Record<string, unknown>;
    if (
      typeof record.FNAME !== "string" ||
      !record.FNAME.trim() ||
      typeof record.LNAME !== "string" ||
      !record.LNAME.trim()
    ) {
      throw new Error(`${label} must have non-empty FNAME and LNAME strings.`);
    }

    const firstName = record.FNAME.trim();
    const lastName = record.LNAME.trim();
    const fullName = `${firstName} ${lastName}`.toLocaleLowerCase();
    if (names.has(fullName)) {
      throw new Error(`Duplicate team member name: ${firstName} ${lastName}.`);
    }
    names.add(fullName);

    const assignedTypes: unknown[] = [];
    for (const assessment of assessments) {
      const assignments = record[assessment];
      if (!Array.isArray(assignments) || assignments.length !== 2) {
        throw new Error(`${label} must have exactly two ${assessment}.`);
      }
      if (
        assignments.some(
          (type: unknown) =>
            typeof type !== "string" || !geniusTypes.includes(type as WorkingGenius),
        )
      ) {
        throw new Error(`${label} has an unknown Working Genius in ${assessment}.`);
      }
      assignedTypes.push(...assignments);
    }

    if (
      new Set(assignedTypes).size !== geniusTypes.length ||
      !geniusTypes.every((genius) => assignedTypes.includes(genius))
    ) {
      throw new Error(`${label} must use each of the six Working Geniuses exactly once.`);
    }

    return {
      FNAME: firstName,
      LNAME: lastName,
      Geniuses: record.Geniuses as WorkingGenius[],
      Competencies: record.Competencies as WorkingGenius[],
      Frustrations: record.Frustrations as WorkingGenius[],
    };
  });
}

function renderMemberControls(): string {
  if (team.length === 0) {
    return `<p class="sidebar-empty">Upload a JSON file with your team's assessment results to get started.</p>`;
  }

  return team
    .map((member, index) => {
      const name = `${member.FNAME} ${member.LNAME}`;
      const checked = selectedMembers.has(index) ? "checked" : "";
      return `
        <label class="member-option">
          <input type="checkbox" data-member-index="${index}" ${checked} />
          <span class="avatar avatar-${index % 6}" aria-hidden="true">${escapeHtml(initials(member))}</span>
          <span class="member-option-name">${escapeHtml(name)}</span>
          <span class="member-option-count">6</span>
        </label>
      `;
    })
    .join("");
}

function renderGeniusFilters(): string {
  return geniusTypes
    .map((genius) => {
      const details = geniusDetails[genius];
      const checked = selectedGeniuses.has(genius) ? "checked" : "";
      return `
        <label class="type-filter ${details.tint}">
          <input type="checkbox" data-genius="${genius}" ${checked} />
          <span class="type-filter-icon" aria-hidden="true">${details.short}</span>
          <span>${genius}</span>
        </label>
      `;
    })
    .join("");
}

function renderAssessmentFilters(): string {
  return assessments
    .map((assessment) => {
      const checked = selectedAssessments.has(assessment) ? "checked" : "";
      return `
        <label class="assessment-filter ${assessment.toLowerCase()}">
          <input type="checkbox" data-assessment="${assessment}" ${checked} />
          <span class="assessment-filter-dot" aria-hidden="true"></span>
          <span>${assessment}</span>
        </label>
      `;
    })
    .join("");
}

function renderMemberPill(member: TeamMember, index: number, status: Assessment): string {
  return `
    <span class="person-pill ${status.toLowerCase()}">
      <span class="person-avatar avatar-${index % 6}" aria-hidden="true">${escapeHtml(initials(member))}</span>
      <span>${escapeHtml(member.FNAME)} ${escapeHtml(member.LNAME)}</span>
    </span>
  `;
}

function renderAssessmentRow(
  members: TeamMember[],
  genius: WorkingGenius,
  status: Assessment,
): string {
  const matches = members
    .map((member) => ({ member, index: team.indexOf(member) }))
    .filter(({ member }) => memberHasAssessment(member, status, genius));
  const plural = matches.length === 1 ? "" : "s";

  return `
    <div class="assessment-row ${status.toLowerCase()}">
      <div class="assessment-label">
        <span class="assessment-dot"></span>
        <span>${assessmentDetails[status].label}</span>
        <span class="assessment-count">${matches.length}</span>
      </div>
      <div class="assessment-people">
        ${
          matches.length
            ? matches.map(({ member, index }) => renderMemberPill(member, index, status)).join("")
            : `<span class="no-matches">No ${assessmentDetails[status].singular.toLowerCase()}${plural} in this view</span>`
        }
      </div>
    </div>
  `;
}

function renderGeniusCard(genius: WorkingGenius, members: TeamMember[]): string {
  const details = geniusDetails[genius];
  const geniusCount = members.filter((member) => memberHasAssessment(member, "Geniuses", genius)).length;
  return `
    <article class="genius-card ${details.tint}">
      <div class="genius-card-header">
        <div class="genius-heading">
          <span class="genius-icon" aria-hidden="true">${details.short}</span>
          <div>
            <h3>${genius}</h3>
            <p>${details.description}</p>
          </div>
        </div>
        ${
          selectedAssessments.has("Geniuses")
            ? `<span class="genius-count" title="${geniusCount} ${geniusCount === 1 ? "genius" : "geniuses"}">
                <strong>${geniusCount}</strong><span> / ${members.length}</span>
              </span>`
            : ""
        }
      </div>
      <div class="assessment-rows">
        ${assessments
          .filter((assessment) => selectedAssessments.has(assessment))
          .map((assessment) => renderAssessmentRow(members, genius, assessment))
          .join("")}
      </div>
    </article>
  `;
}

function renderDashboard(): string {
  const members = selectedTeam();
  const activeGeniuses = geniusTypes.filter((genius) => selectedGeniuses.has(genius));
  const activeAssessments = assessments.filter((assessment) =>
    selectedAssessments.has(assessment),
  );
  const mappedCount = members.reduce((count, member) => count + member.Geniuses.length, 0);

  const board =
    team.length === 0
      ? `<div class="status-card empty-card"><span class="status-icon" aria-hidden="true">↑</span><div><strong>Upload your team data to get started</strong><p>Choose a .json file containing each teammate's name, geniuses, competencies, and frustrations.</p></div></div>`
      : activeGeniuses.length === 0
        ? `<div class="status-card empty-card"><span class="status-icon" aria-hidden="true">✳</span><div><strong>No genius views selected</strong><p>Turn on one or more views above to explore your team.</p></div></div>`
        : members.length === 0
          ? `<div class="status-card empty-card"><span class="status-icon" aria-hidden="true">✳</span><div><strong>No teammates selected</strong><p>Select at least one teammate to see the team map.</p></div></div>`
          : activeAssessments.length === 0
            ? `<div class="status-card empty-card"><span class="status-icon" aria-hidden="true">✳</span><div><strong>No assessment categories selected</strong><p>Turn on Genius, Competencies, or Frustrations to see the team map.</p></div></div>`
            : `<div class="genius-grid">${activeGeniuses
                .map((genius) => renderGeniusCard(genius, members))
                .join("")}</div>`;

  return `
    <header class="topbar">
      <a class="brand" href="/" aria-label="Working Genius team map home">
        <span class="brand-mark">wg</span>
        <span class="brand-divider"></span>
        <span class="brand-name">TEAM MAP</span>
      </a>
      <div class="topbar-right">
        <span class="live-indicator"><span></span> LIVE VIEW</span>
        <span class="topbar-caption">Your team's best work, at a glance.</span>
      </div>
    </header>

    <main class="page-shell">
      <section class="intro">
        <div class="intro-copy">
          <div class="eyebrow"><span class="eyebrow-line"></span> THE WAY YOUR TEAM WORKS</div>
          <h1>Better work<br /><span>starts with knowing.</span></h1>
          <p class="intro-description">See the gifts each person brings — and how they come together to move work forward.</p>
        </div>
        <div class="intro-note">
          <span class="note-icon" aria-hidden="true">✳</span>
          <p>Every kind of work matters.<br /><strong>Every genius belongs.</strong></p>
        </div>
      </section>

      <section class="summary-strip" aria-label="Team map summary">
        <div class="summary-item">
          <span class="summary-icon members-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87m-1-12.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          <div><strong>${members.length}<span> / ${team.length}</span></strong><small>TEAM MEMBERS</small></div>
        </div>
        <span class="summary-divider"></span>
        <div class="summary-item">
          <span class="summary-icon genius-summary-icon" aria-hidden="true">✳</span>
          <div><strong>${mappedCount}</strong><small>GENIUS STRENGTHS</small></div>
        </div>
        <span class="summary-divider"></span>
        <div class="summary-item">
          <span class="summary-icon views-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/></svg>
          </span>
          <div><strong>${activeGeniuses.length}<span> / 6</span></strong><small>VIEWS ACTIVE</small></div>
        </div>
        <span class="summary-spacer"></span>
        <span class="summary-live"><span></span> Updates as you filter</span>
      </section>

      <div class="workspace">
        <aside class="sidebar">
          <div class="sidebar-heading">
            <div><span class="section-kicker">YOUR PEOPLE</span><h2>Team members</h2></div>
            <span class="sidebar-total">${team.length}</span>
          </div>
          <label class="upload-button">
            <input id="team-file-input" type="file" accept=".json,application/json" />
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/></svg>
            <span>${team.length ? "Replace team data" : "Upload team JSON"}</span>
          </label>
          ${
            importedFileName
              ? `<p class="upload-file-name" title="${escapeHtml(importedFileName)}">${escapeHtml(importedFileName)} loaded</p>`
              : ""
          }
          ${
            importError
              ? `<p class="upload-error" role="alert">${escapeHtml(importError)}</p>`
              : ""
          }
          <div class="member-actions">
            <button type="button" class="text-button" data-action="select-all">Select all</button>
            <span class="action-divider"></span>
            <button type="button" class="text-button" data-action="clear-all">Clear</button>
          </div>
          <div class="member-list">${renderMemberControls()}</div>
          <div class="sidebar-footer">
            <span class="footer-lock" aria-hidden="true">◎</span>
            <span>Private to your team</span>
          </div>
        </aside>

        <section class="map-content">
          <div class="map-toolbar">
            <div>
              <span class="section-kicker">THE WORKING GENIUS MAP</span>
              <h2>Explore the six types</h2>
            </div>
            <span class="showing-count"><strong>${members.length}</strong> ${members.length === 1 ? "person" : "people"} in view</span>
          </div>
          <div class="type-filters" aria-label="Filter by Working Genius">
            ${renderGeniusFilters()}
          </div>
          <div class="assessment-filters" role="group" aria-label="Filter assessment categories">
            <span class="assessment-filters-label">SHOW</span>
            ${renderAssessmentFilters()}
          </div>
          <div class="board-heading">
            <span>TEAM DISTRIBUTION</span>
            <span class="board-key">${activeAssessments
              .map((assessment) => {
                const key = assessmentDetails[assessment].key;
                return `<i class="key-dot ${key}-key"></i> ${assessment}`;
              })
              .join(" ")}</span>
          </div>
          ${board}
        </section>
      </div>
      <footer class="page-footer">
        <span>THE WORKING GENIUS MODEL</span>
        <span>Six types. One stronger team.</span>
      </footer>
    </main>
  `;
}

function render(): void {
  app.innerHTML = renderDashboard();
}

app.addEventListener("change", (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.id === "team-file-input") {
    void importTeamFile(target);
    return;
  }

  if (target.dataset.memberIndex !== undefined) {
    const index = Number(target.dataset.memberIndex);
    if (target.checked) {
      selectedMembers.add(index);
    } else {
      selectedMembers.delete(index);
    }
    render();
    return;
  }

  const genius = target.dataset.genius as WorkingGenius | undefined;
  if (genius && geniusTypes.includes(genius)) {
    if (target.checked) {
      selectedGeniuses.add(genius);
    } else {
      selectedGeniuses.delete(genius);
    }
    render();
    return;
  }

  const assessment = target.dataset.assessment as Assessment | undefined;
  if (assessment && assessments.includes(assessment)) {
    if (target.checked) {
      selectedAssessments.add(assessment);
    } else {
      selectedAssessments.delete(assessment);
    }
    render();
  }
});

async function importTeamFile(input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0];
  input.value = "";
  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".json")) {
    importError = "Choose a file with the .json extension.";
    render();
    return;
  }

  try {
    const importedTeam = validateTeam(JSON.parse(await file.text()) as unknown);
    team = importedTeam;
    selectedMembers = new Set(team.map((_, index) => index));
    importedFileName = file.name;
    importError = "";
  } catch (error) {
    importError =
      error instanceof SyntaxError
        ? "The selected file is not valid JSON."
        : error instanceof Error
          ? error.message
          : "Unable to read the selected team file.";
  }
  render();
}

app.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>("[data-action]");
  if (!button) {
    return;
  }

  if (button.dataset.action === "select-all") {
    selectedMembers = new Set(team.map((_, index) => index));
  } else if (button.dataset.action === "clear-all") {
    selectedMembers.clear();
  } else {
    return;
  }
  render();
});

render();
