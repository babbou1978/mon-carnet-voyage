export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, accessToken } = req.body;
  if (!userId || !accessToken) return res.status(400).json({ error: 'Missing userId or accessToken' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || !supabaseUrl) {
    return res.status(500).json({ error: 'Missing server configuration (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL)' });
  }

  try {
    // Verify the access token belongs to this user (using service role key for reliable server-side auth)
    const authCheck = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': serviceRoleKey }
    });
    const authUser = await authCheck.json();
    if (!authCheck.ok || authUser.id !== userId) {
      console.error('Auth check failed:', authCheck.status, JSON.stringify(authUser));
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Helper to delete from a table using service role
    const deleteFrom = async (table, column, value) => {
      await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });
    };

    // Delete friendships (two columns)
    await deleteFrom('friendships', 'requester_id', userId);
    await deleteFrom('friendships', 'addressee_id', userId);

    // Delete all user data in correct FK order
    await deleteFrom('closed_places', 'confirmed_by', userId);
    await deleteFrom('memories', 'user_id', userId);
    await deleteFrom('preferences', 'user_id', userId);
    await deleteFrom('profiles', 'user_id', userId);

    // Delete auth user via Admin API
    const deleteAuth = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    });

    if (!deleteAuth.ok) {
      const err = await deleteAuth.text();
      console.error('Delete auth user error:', err);
      return res.status(500).json({ error: `Failed to delete auth user: ${err}` });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Delete account error:', e);
    return res.status(500).json({ error: e.message });
  }
}
