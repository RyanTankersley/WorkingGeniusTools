import "./styles.css";
import "./builder.css";
import "./roster.css";
import { displayName, renderRosterTypes, sortTeamByName } from "./roster-view";
import { geniusTypes, validateTeam, type TeamMember, type WorkingGenius } from "./team-data";

const app: HTMLDivElement =
  document.querySelector<HTMLDivElement>("#app") ??
  (() => {
    throw new Error("The app root element is missing.");
  })();

let team: TeamMember[] = [];
let editingIndex: number | null = null;
let firstName = "";
let lastName = "";
let geniuses: WorkingGenius[] = [];
let frustrations: WorkingGenius[] = [];
let message = "";
let messageIsError = false;

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

function competenciesFor(
  selectedGeniuses: WorkingGenius[],
  selectedFrustrations: WorkingGenius[],
): WorkingGenius[] {
  return geniusTypes.filter(
    (type) => !selectedGeniuses.includes(type) && !selectedFrustrations.includes(type),
  );
}

function renderTypePicker(
  category: "genius" | "frustration",
  selected: WorkingGenius[],
  otherSelected: WorkingGenius[],
): string {
  return `
    <div class="builder-type-grid" role="group" aria-label="${category === "genius" ? "Select two geniuses" : "Select two frustrations"}">
      ${geniusTypes
        .map((type) => {
          const isSelected = selected.includes(type);
          const disabled =
            !isSelected && (selected.length >= 2 || otherSelected.includes(type));
          const initial = type.charAt(0);
          return `<button
            type="button"
            class="builder-type ${category}-type ${isSelected ? "is-selected" : ""}"
            data-category="${category}"
            data-type="${type}"
            aria-pressed="${isSelected}"
            ${disabled ? "disabled" : ""}
          ><span class="builder-type-initial">${initial}</span><span>${type}</span></button>`;
        })
        .join("")}
    </div>
  `;
}

function renderMember(member: TeamMember, index: number): string {
  return `
    <div class="team-roster-row builder-roster-row">
      <span class="team-roster-name">${escapeHtml(displayName(member))}</span>
      <div class="team-roster-types" aria-label="Working Genius types">${renderRosterTypes(member)}</div>
      <div class="builder-member-actions">
        <button type="button" class="text-action" data-edit="${index}">Edit</button>
        <button type="button" class="text-action delete-action" data-delete="${index}">Delete</button>
      </div>
    </div>
  `;
}

function render(): void {
  const profileIsComplete = geniuses.length === 2 && frustrations.length === 2;
  const competencies = profileIsComplete ? competenciesFor(geniuses, frustrations) : [];
  app.innerHTML = `
    <header class="topbar builder-topbar">
      <a class="header-brand" href="/" aria-label="Working Genius Team Map home">
        <span class="brand-mark" aria-hidden="true">wg</span>
        <span class="header-copy"><strong>Working Genius</strong><span>TEAM BUILDER</span></span>
      </a>
      <a class="header-action" href="/">Back to team map</a>
    </header>
    <main class="page-shell builder-shell">
      <section class="builder-intro">
        <span class="section-kicker">TEAM DATA WORKSHOP</span>
        <h1>Build your team<span>.</span></h1>
        <p>Add each person's Working Genius profile, then download a JSON file ready for your team map.</p>
      </section>

      <section class="builder-workspace">
        <div class="builder-form-panel">
          <div class="builder-panel-heading">
            <div><span class="section-kicker">${editingIndex === null ? "NEW PROFILE" : "EDIT PROFILE"}</span><h2>${editingIndex === null ? "Add a team member" : "Update team member"}</h2></div>
            <span class="builder-step">01</span>
          </div>
          <form id="member-form" novalidate>
            <div class="builder-name-fields">
              <label>First name<input name="firstName" autocomplete="given-name" value="${escapeHtml(firstName)}" placeholder="e.g. Alex" required /></label>
              <label>Last name<input name="lastName" autocomplete="family-name" value="${escapeHtml(lastName)}" placeholder="e.g. Morgan" required /></label>
            </div>
            <section class="builder-picker-section">
              <div class="builder-picker-heading"><div><h3>Geniuses</h3><p>Choose the two types that energize them.</p></div><span>${geniuses.length} / 2</span></div>
              ${renderTypePicker("genius", geniuses, frustrations)}
            </section>
            <section class="builder-picker-section">
              <div class="builder-picker-heading"><div><h3>Frustrations</h3><p>Choose the two types that drain them.</p></div><span>${frustrations.length} / 2</span></div>
              ${renderTypePicker("frustration", frustrations, geniuses)}
            </section>
            <div class="builder-competency-preview">
              <div><span class="section-kicker">INFERRED AUTOMATICALLY</span><strong>Competencies</strong></div>
              <div class="builder-preview-tags">${competencies.map((type) => `<span>${type}</span>`).join("") || `<span class="preview-placeholder">Select two geniuses and two frustrations</span>`}</div>
            </div>
            ${message ? `<p class="builder-message ${messageIsError ? "is-error" : ""}" role="${messageIsError ? "alert" : "status"}">${escapeHtml(message)}</p>` : ""}
            <div class="builder-form-actions">
              <button type="submit" class="primary-action">${editingIndex === null ? "Add to team" : "Save changes"}</button>
              ${editingIndex !== null ? `<button type="button" class="secondary-action" data-cancel-edit>Cancel</button>` : ""}
            </div>
          </form>
        </div>

        <aside class="builder-import-panel">
          <span class="import-icon" aria-hidden="true">↑</span>
          <div><strong>Already have a JSON file?</strong><p>Import it to start from an existing team. Your current list will be replaced after a valid import.</p></div>
          <label class="secondary-action import-action">
            <input id="builder-file-input" type="file" accept=".json,application/json" />
            <span>Import team JSON</span>
          </label>
        </aside>
      </section>

      <section class="builder-team-section team-roster-section">
        <div class="builder-team-heading team-roster-heading">
          <div>
            <span class="section-kicker">YOUR ROSTER</span>
            <h2>Team members <span>${team.length}</span></h2>
            <button type="button" class="download-action" data-download>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 18v2h14v-2"/></svg>
              Download JSON
            </button>
          </div>
        </div>
        ${team.length
          ? `<div class="team-roster-list">${sortTeamByName(team)
              .map((member) => renderMember(member, team.indexOf(member)))
              .join("")}</div>`
          : `<div class="builder-empty"><span class="empty-spark" aria-hidden="true">✳</span><strong>Your team starts here</strong><p>Add a member or import an existing JSON file to build your roster.</p></div>`}
      </section>
      <footer class="page-footer"><span>THE WORKING GENIUS MODEL</span><span>Six types. One stronger team.</span></footer>
    </main>
  `;
}

function resetForm(): void {
  editingIndex = null;
  firstName = "";
  lastName = "";
  geniuses = [];
  frustrations = [];
}

function saveMember(form: HTMLFormElement): void {
  const formData = new FormData(form);
  firstName = String(formData.get("firstName") ?? "").trim();
  lastName = String(formData.get("lastName") ?? "").trim();

  if (!firstName || !lastName) {
    message = "Enter both a first and last name.";
    messageIsError = true;
  } else if (geniuses.length !== 2 || frustrations.length !== 2) {
    message = "Choose exactly two geniuses and two frustrations.";
    messageIsError = true;
  } else {
    const fullName = `${firstName} ${lastName}`.toLocaleLowerCase();
    const duplicate = team.some(
      (member, index) =>
        index !== editingIndex &&
        `${member.FNAME} ${member.LNAME}`.toLocaleLowerCase() === fullName,
    );
    if (duplicate) {
      message = `A team member named ${firstName} ${lastName} already exists.`;
      messageIsError = true;
    } else {
      const member: TeamMember = {
        FNAME: firstName,
        LNAME: lastName,
        Geniuses: [...geniuses],
        Competencies: competenciesFor(geniuses, frustrations),
        Frustrations: [...frustrations],
      };
      if (editingIndex === null) {
        team.push(member);
        message = `${firstName} added to the team.`;
      } else {
        team[editingIndex] = member;
        message = `${firstName}'s profile updated.`;
      }
      messageIsError = false;
      resetForm();
    }
  }
  render();
}

async function importTeam(input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  try {
    if (!file.name.toLowerCase().endsWith(".json")) {
      throw new Error("Choose a file with the .json extension.");
    }
    team = validateTeam(JSON.parse(await file.text()) as unknown);
    resetForm();
    message = `Imported ${team.length} ${team.length === 1 ? "team member" : "team members"}.`;
    messageIsError = false;
  } catch (error) {
    message = error instanceof SyntaxError
      ? "The selected file is not valid JSON."
      : error instanceof Error
        ? error.message
        : "Unable to read the selected team file.";
    messageIsError = true;
  }
  render();
}

function downloadTeam(): void {
  const contents = `${JSON.stringify(team, null, 2)}\n`;
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "team.json";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

app.addEventListener("input", (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.name === "firstName") firstName = target.value;
  if (target.name === "lastName") lastName = target.value;
});

app.addEventListener("submit", (event: SubmitEvent) => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== "member-form") return;
  event.preventDefault();
  saveMember(event.target);
});

app.addEventListener("change", (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.id === "builder-file-input") {
    void importTeam(target);
  }
});

app.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest<HTMLButtonElement>(
    "[data-category], [data-edit], [data-delete], [data-cancel-edit], [data-download]",
  );
  if (!button) return;

  if (button.dataset.category && button.dataset.type) {
    const type = button.dataset.type as WorkingGenius;
    const selected = button.dataset.category === "genius" ? geniuses : frustrations;
    const otherSelected = button.dataset.category === "genius" ? frustrations : geniuses;
    if (selected.includes(type)) {
      selected.splice(selected.indexOf(type), 1);
    } else if (selected.length < 2 && !otherSelected.includes(type)) {
      selected.push(type);
    }
    message = "";
  } else if (button.dataset.edit !== undefined) {
    const index = Number(button.dataset.edit);
    const member = team[index];
    if (!member) return;
    editingIndex = index;
    firstName = member.FNAME;
    lastName = member.LNAME;
    geniuses = [...member.Geniuses];
    frustrations = [...member.Frustrations];
    message = "";
  } else if (button.dataset.delete !== undefined) {
    const index = Number(button.dataset.delete);
    if (!Number.isInteger(index) || index < 0 || index >= team.length) return;
    const [removed] = team.splice(index, 1);
    if (editingIndex === index) {
      resetForm();
    } else if (editingIndex !== null && editingIndex > index) {
      editingIndex -= 1;
    }
    message = `${removed.FNAME} removed from the team.`;
    messageIsError = false;
  } else if (button.hasAttribute("data-cancel-edit")) {
    resetForm();
    message = "";
  } else if (button.hasAttribute("data-download")) {
    downloadTeam();
    return;
  }
  render();
});

render();
