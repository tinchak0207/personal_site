export function insertPromptSnippet(basePrompt: string, snippet: string): string {
  const current = basePrompt.trim();
  const addition = snippet.trim();

  if (!addition) return current;
  if (!current) return addition;
  if (current.includes(addition)) return current;

  return `${current}\n\n${addition}`;
}
