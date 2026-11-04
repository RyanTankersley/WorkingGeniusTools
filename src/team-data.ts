export type WorkingGenius =
  | "Wonder"
  | "Invention"
  | "Discernment"
  | "Galvanizing"
  | "Enablement"
  | "Tenacity";

export type Assessment = "Geniuses" | "Competencies" | "Frustrations";

export interface TeamMember {
  FNAME: string;
  LNAME: string;
  Geniuses: WorkingGenius[];
  Competencies: WorkingGenius[];
  Frustrations: WorkingGenius[];
}

export const geniusTypes: WorkingGenius[] = [
  "Wonder",
  "Invention",
  "Discernment",
  "Galvanizing",
  "Enablement",
  "Tenacity",
];

export const assessments: Assessment[] = ["Geniuses", "Competencies", "Frustrations"];

export function validateTeam(value: unknown): TeamMember[] {
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
