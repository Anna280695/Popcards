// Read saved account totals directly, including players with zero points.
export async function fetchVerifiedRankings(db, userId) {
  const { data, error } = await db.from('profiles')
    .select('id,username,display_name,total_score')
    .order('total_score', { ascending: false })
    .order('id', { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data || []).map(p => ({
    id: p.id, username:p.username, n: p.display_name || p.username,
    total: Number(p.total_score) || 0, week: 0,
    you: p.id === userId, a: 1
  }));
}
