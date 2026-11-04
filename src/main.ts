import "./styles.css";
import "./roster.css";
import {
  assessments,
  geniusTypes,
  validateTeam,
  type Assessment,
  type TeamMember,
  type WorkingGenius,
} from "./team-data";

interface GeniusDetails {
  short: string;
  tint: string;
}

const geniusDetails: Record<WorkingGenius, GeniusDetails> = {
  Wonder: {
    short: "W",
    tint: "wonder",
  },
  Invention: {
    short: "I",
    tint: "invention",
  },
  Discernment: {
    short: "D",
    tint: "discernment",
  },
  Galvanizing: {
    short: "G",
    tint: "galvanizing",
  },
  Enablement: {
    short: "E",
    tint: "enablement",
  },
  Tenacity: {
    short: "T",
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

const app: HTMLDivElement =
  document.querySelector<HTMLDivElement>("#app") ??
  (() => {
    throw new Error("The app root element is missing.");
  })();

let team: TeamMember[] = [];
let selectedMembers = new Set<number>();
let selectedAssessments = new Set<Assessment>(assessments);
let focusedMember: { index: number; previousSelection: Set<number> } | null = null;
let importError = "";

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

function renderMemberPill(member: TeamMember, index: number, status: Assessment): string {
  const fullName = `${member.FNAME} ${member.LNAME}`;
  const isFocused = focusedMember?.index === index;
  return `
    <button
      type="button"
      class="person-pill ${status.toLowerCase()} ${isFocused ? "is-focused" : ""}"
      data-focus-member-index="${index}"
      aria-pressed="${isFocused}"
      aria-label="${isFocused ? "Clear focus on" : "Focus on"} ${escapeHtml(fullName)}"
      title="${escapeHtml(fullName)}"
    >
      <span class="person-avatar avatar-${index % 6}" aria-hidden="true">${escapeHtml(initials(member))}</span>
      <span>${escapeHtml(member.FNAME)}</span>
    </button>
  `;
}

function renderMemberFilters(): string {
  if (team.length === 0) {
    return `<span class="member-filter-empty">Upload team JSON to filter members</span>`;
  }

  return team
    .map((member, index) => {
      const isSelected = selectedMembers.has(index);
      const fullName = `${member.FNAME} ${member.LNAME}`;
      return `
        <button
          type="button"
          class="member-filter ${isSelected ? "is-selected" : "is-off"}"
          data-member-index="${index}"
          aria-pressed="${isSelected}"
          aria-label="${isSelected ? "Exclude" : "Include"} ${escapeHtml(fullName)}"
        >${escapeHtml(fullName)}</button>
      `;
    })
    .join("");
}

function renderRoster(): string {
  if (team.length === 0) {
    return "";
  }

  const rosterAssessments = [
    { title: "Geniuses", key: "Geniuses", className: "genius" },
    { title: "Competencies", key: "Competencies", className: "competency" },
    { title: "Frustrations", key: "Frustrations", className: "frustration" },
  ] as const;

  return `
    <section class="team-roster-section" aria-labelledby="team-roster-title">
      <div class="team-roster-heading">
        <div>
          <span class="section-kicker">YOUR ROSTER</span>
          <h2 id="team-roster-title">Team members <span>${team.length}</span></h2>
        </div>
      </div>
      <div class="team-roster-list">
        ${team
          .map(
            (member) => `
              <article class="team-roster-card">
                <div class="team-roster-card-heading">
                  <div class="team-roster-member-name">
                    <span class="team-roster-avatar" aria-hidden="true">${escapeHtml(initials(member))}</span>
                    <div><h3>${escapeHtml(member.FNAME)} ${escapeHtml(member.LNAME)}</h3><span>TEAM MEMBER</span></div>
                  </div>
                </div>
                <div class="team-roster-assessments">
                  ${rosterAssessments
                    .map(
                      ({ title, key, className }) => `
                        <div class="team-roster-assessment ${className}">
                          <span>${title}</span>
                          <div>${member[key]
                            .map((type) => `<span class="team-roster-tag">${type}</span>`)
                            .join("")}</div>
                        </div>`,
                    )
                    .join("")}
                </div>
              </article>`,
          )
          .join("")}
      </div>
    </section>
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
  const visibleMatches = matches.filter(({ index }) => selectedMembers.has(index));

  return `
    <div class="assessment-row ${status.toLowerCase()}">
      <div class="assessment-label">
        <span class="assessment-dot"></span>
        <span>${assessmentDetails[status].label}</span>
        <span class="assessment-count">${visibleMatches.length}</span>
      </div>
      <div class="assessment-people">
        ${visibleMatches
          .map(({ member, index }) => renderMemberPill(member, index, status))
          .join("")}
      </div>
    </div>
  `;
}

function renderGeniusCard(genius: WorkingGenius, members: TeamMember[]): string {
  const details = geniusDetails[genius];
  const selected = members.filter((member) =>
    selectedMembers.has(team.indexOf(member)),
  );
  const geniusCount = selected.filter((member) =>
    memberHasAssessment(member, "Geniuses", genius),
  ).length;
  return `
    <article class="genius-card ${details.tint}">
      <div class="genius-card-header">
        <div class="genius-heading">
          <span class="genius-icon" aria-hidden="true">${details.short}</span>
          <div>
            <h3>${genius}</h3>
          </div>
        </div>
        ${
          selectedAssessments.has("Geniuses")
            ? `<span class="genius-count" title="${geniusCount} ${geniusCount === 1 ? "genius" : "geniuses"}">
                <strong>${geniusCount}</strong><span> / ${selected.length}</span>
              </span>`
            : ""
        }
      </div>
      <div class="assessment-columns">
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
  const activeGeniuses = geniusTypes;
  const activeAssessments = assessments.filter((assessment) =>
    selectedAssessments.has(assessment),
  );

  const board =
    team.length === 0
      ? `<div class="status-card empty-card"><span class="status-icon" aria-hidden="true">↑</span><div><strong>Upload your team data to get started</strong><p>Choose a .json file containing each teammate's name, geniuses, competencies, and frustrations.</p></div></div>`
      : `<div class="genius-grid">${activeGeniuses
          .map((genius) => renderGeniusCard(genius, team))
          .join("")}</div>`;

  return `
    <header class="topbar" aria-label="Working Genius Team Map">
      <div class="header-brand">
        <span class="brand-mark" aria-hidden="true">wg</span>
        <span class="header-copy">
          <strong>Working Genius</strong>
          <span>TEAM MAP</span>
        </span>
      </div>
      <div class="header-note" aria-hidden="true">
        <span class="header-type-dots">
          <i></i><i></i><i></i><i></i><i></i><i></i>
        </span>
        <span>Six types. One stronger team.</span>
      </div>
      <a class="header-action" href="/builder.html">Build a team</a>
    </header>
    <main class="page-shell">
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
          <div><strong>${activeAssessments.length}<span> / 3</span></strong><small>CATEGORIES DISPLAYED</small></div>
        </div>
        <span class="summary-divider"></span>
        <div class="summary-item">
          <span class="summary-icon views-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/></svg>
          </span>
          <div><strong>${activeGeniuses.length}<span> / 6</span></strong><small>TYPES DISPLAYED</small></div>
        </div>
        <span class="summary-spacer"></span>
        <span class="summary-live"><span></span> Updates as you filter</span>
      </section>

      <section class="upload-panel" aria-label="Upload team data">
        <label class="upload-button">
          <input id="team-file-input" type="file" accept=".json,application/json" />
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/></svg>
          <span>${team.length ? "Replace team JSON" : "Upload team JSON"}</span>
        </label>
        ${importError ? `<p class="upload-error" role="alert">${escapeHtml(importError)}</p>` : ""}
      </section>

      ${renderRoster()}

      <section class="distribution">
        <div class="distribution-heading">
          <div>
            <span class="section-kicker">TEAM OVERVIEW</span>
            <h2>Team Distribution</h2>
          </div>
          <span class="showing-count"><strong>${members.length}</strong> ${members.length === 1 ? "person" : "people"} in view</span>
        </div>
        <div class="board-key" role="group" aria-label="Team distribution filters">
          <div class="category-toggles" role="group" aria-label="Assessment categories">
            ${assessments
              .map((assessment) => {
                const isSelected = selectedAssessments.has(assessment);
                const key = assessmentDetails[assessment].key;
                return `<button type="button" class="category-toggle ${isSelected ? "is-selected" : "is-off"}" data-assessment="${assessment}" aria-pressed="${isSelected}">
                  <i class="key-dot ${key}-key" aria-hidden="true"></i>
                  <span>${assessment}</span>
                </button>`;
              })
              .join("")}
          </div>
          <span class="filter-divider" aria-hidden="true"></span>
          <div class="member-filter-group" role="group" aria-label="Team members">
            <span class="member-filter-heading">TEAM MEMBERS</span>
            <div class="member-toggles">${renderMemberFilters()}</div>
          </div>
        </div>
        ${board}
      </section>

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
    focusedMember = null;
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

  const button = target.closest<HTMLButtonElement>(
    "[data-member-index], [data-focus-member-index], [data-assessment]",
  );
  if (!button) {
    return;
  }

  if (button.dataset.focusMemberIndex !== undefined) {
    const index = Number(button.dataset.focusMemberIndex);
    if (!Number.isInteger(index) || index < 0 || index >= team.length) {
      return;
    }

    if (focusedMember?.index === index) {
      selectedMembers = new Set(focusedMember.previousSelection);
      focusedMember = null;
    } else if (focusedMember) {
      selectedMembers = new Set([index]);
      focusedMember = { ...focusedMember, index };
    } else {
      focusedMember = { index, previousSelection: new Set(selectedMembers) };
      selectedMembers = new Set([index]);
    }
  } else if (button.dataset.memberIndex !== undefined) {
    const index = Number(button.dataset.memberIndex);
    if (!Number.isInteger(index) || index < 0 || index >= team.length) {
      return;
    }

    if (focusedMember) {
      selectedMembers = new Set(focusedMember.previousSelection);
      focusedMember = null;
    }

    if (selectedMembers.has(index)) {
      selectedMembers.delete(index);
    } else {
      selectedMembers.add(index);
    }
  } else {
    const assessment = button.dataset.assessment as Assessment | undefined;
    if (!assessment || !assessments.includes(assessment)) {
      return;
    }

    if (selectedAssessments.has(assessment)) {
      selectedAssessments.delete(assessment);
    } else {
      selectedAssessments.add(assessment);
    }
  }
  render();
});

render();
