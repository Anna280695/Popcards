// Supabase social data access. No UI or window state dependencies.
export async function loadSocialData(db) {
  const [profiles, requests, challenges] = await Promise.all([
    db.from('profiles').select('id,username,display_name').limit(500),
    db.from('friend_requests').select('*').order('created_at',{ascending:false}),
    db.from('challenges').select('*').order('created_at',{ascending:false}).limit(100)
  ]);
  for (const result of [profiles, requests, challenges]) {
    if (result.error) throw result.error;
  }
  return { people: profiles.data || [], requests: requests.data || [], challenges: challenges.data || [] };
}

export function acceptedFriendIds(requests, userId) {
  if (!userId) return [];
  return requests.filter(r => r.status === 'accepted' && (r.sender_id === userId || r.receiver_id === userId))
    .map(r => r.sender_id === userId ? r.receiver_id : r.sender_id);
}

export function findPerson(people, id) {
  return people.find(p => p.id === id) || { id, display_name: 'Player', username: 'unknown' };
}

export function subscribeToSocial(db, userId, onUpdate) {
  return db.channel('popcards-online-' + userId)
    .on('postgres_changes', {event:'*',schema:'public',table:'friend_requests'}, onUpdate)
    .on('postgres_changes', {event:'*',schema:'public',table:'challenges'}, onUpdate)
    .on('postgres_changes', {event:'*',schema:'public',table:'profiles'}, onUpdate)
    .subscribe();
}
