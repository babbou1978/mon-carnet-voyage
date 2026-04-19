import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, userId, targetEmail, friendshipId } = req.body;

  try {
    if (action === 'search') {
      // Chercher un utilisateur par email
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .ilike('email', `%${targetEmail}%`)
        .neq('user_id', userId)
        .limit(5);
      if (error) throw error;
      return res.status(200).json({ users: data });

    } else if (action === 'sendRequest') {
      // Envoyer une demande d'ami
      const { error } = await supabase.from('friendships').insert({
        requester_id: userId,
        addressee_id: targetEmail, // on passe l'user_id ici
        status: 'pending'
      });
      if (error) throw error;
      return res.status(200).json({ ok: true });

    } else if (action === 'accept') {
      const { error } = await supabase.from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);
      if (error) throw error;
      return res.status(200).json({ ok: true });

    } else if (action === 'decline') {
      const { error } = await supabase.from('friendships')
        .delete().eq('id', friendshipId);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
