import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email } = req.body;
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'Carnet de Voyage <onboarding@resend.dev>',
      to: 'brice.abbou@outlook.com',
      subject: `🗺️ Nouvelle inscription — ${firstName} ${lastName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0e0c; color: #f0ead8; border-radius: 12px;">
          <h2 style="font-size: 24px; color: #c9a84c; margin-bottom: 8px;">Nouvelle inscription</h2>
          <p style="color: #8a8070; font-size: 13px; margin-bottom: 24px;">Mon Carnet de Voyage</p>
          <p><strong>Nom :</strong> ${firstName} ${lastName}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p style="color: #8a8070; font-size: 12px; margin-top: 24px;">Cet email a été envoyé automatiquement.</p>
        </div>
      `,
    });
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur envoi email' });
  }
}
