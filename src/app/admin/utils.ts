/** Merge new tags into the global skills list, deduplicating by name. */
export function syncTagsToSkills(currentData: any, newTags: string[]): any {
  if (!newTags || newTags.length === 0) return currentData;

  const existingSkills: any[] = currentData.skills || [];
  const existingNames = existingSkills.map((s: any) => s.name.toLowerCase());
  const fresh: any[] = [];

  newTags.forEach(tag => {
    const clean = tag.trim();
    if (clean && !existingNames.includes(clean.toLowerCase())) {
      fresh.push({ id: Date.now() + Math.random(), name: clean, category: "technical" });
    }
  });

  if (fresh.length === 0) return currentData;
  return { ...currentData, skills: [...existingSkills, ...fresh] };
}
