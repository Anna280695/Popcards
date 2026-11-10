// Optional features must not prevent account and social initialization.
export async function loadOptionalFeature(load, onError) {
  try {
    return await load();
  } catch (error) {
    onError(error);
    return null;
  }
}

export function setupMessage(error, migration) {
  if (['PGRST202', 'PGRST204', '42883', '42703', '42P01'].includes(error?.code)) {
    return `Online database update needed: run ${migration} in Supabase, then reload.`;
  }
  return error?.message || 'Unable to connect. Please try again.';
}
