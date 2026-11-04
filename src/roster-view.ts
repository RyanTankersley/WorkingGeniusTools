import { geniusTypes, type TeamMember } from "./team-data";

export function renderRosterTypes(member: TeamMember): string {
  const categories = [
    { name: "Genius", className: "genius", types: member.Geniuses },
    { name: "Competency", className: "competency", types: member.Competencies },
    { name: "Frustration", className: "frustration", types: member.Frustrations },
  ];

  return categories
    .flatMap(({ name, className, types }) =>
      geniusTypes
        .filter((type) => types.includes(type))
        .map(
          (type) =>
            `<span class="roster-type roster-type-${className}" title="${type}: ${name}" aria-label="${type}: ${name}">${type[0]}</span>`,
        ),
    )
    .join("");
}

export function sortTeamByName<T extends TeamMember>(team: T[]): T[] {
  return [...team].sort(
    (first, second) =>
      first.LNAME.localeCompare(second.LNAME, undefined, { sensitivity: "base" }) ||
      first.FNAME.localeCompare(second.FNAME, undefined, { sensitivity: "base" }),
  );
}

export function displayName(member: TeamMember): string {
  return `${member.LNAME}, ${member.FNAME}`;
}
