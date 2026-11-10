// Server-controlled clue allowance for authenticated players.
export async function getClueAllowance(db) {
  const { data, error } = await db.rpc('get_clue_allowance');
  if (error) throw error;
  return data?.[0] || null;
}
export async function consumeServerClue(db) {
  const { data, error } = await db.rpc('consume_clue');
  if (error) throw error;
  if (!data?.[0]) throw new Error('Could not load clue allowance');
  return data[0];
}
