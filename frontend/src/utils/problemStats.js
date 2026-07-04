export function deriveProblemStats(problems = [], apiSolvedCount, apiTotalCount) {
  const total = apiTotalCount ?? problems.length;
  const solvedFromList = problems.filter((p) => p.solved).length;
  const solved = apiSolvedCount ?? solvedFromList;
  const open = Math.max(0, total - solved);

  return { solved, total, open };
}