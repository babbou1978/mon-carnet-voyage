import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, accessToken } = req.body;
  if (!userId || !accessToken) return res.status(400).json({ error: 'Missing userId or accessToken' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return res.status(500).json({ error: 'Server not configured for account deletion (missing service role key)' });
  }

  // Verify the access token belongs to this user (security check)
  const userClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await userClient.auth.getUser(accessToken);
  if (authError || !user || user.id !== userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Use admin client with service role key
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Delete all user data first
    await adminClient.from('memories').delete().eq('user_id', userId);
    await adminClient.from('preferences').delete().eq('user_id', userId);
    await adminClient.from('friendships').delete().or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    await adminClient.from('profiles').delete().eq('user_id', userId);
    await adminClient.from('closed_places').delete().eq('confirmed_by', userId);

    // Delete auth user (requires service role)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Delete account error:', e);
    return res.status(500).json({ error: e.message });
  }
}
