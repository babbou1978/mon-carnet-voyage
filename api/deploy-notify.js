// Vercel deploy webhook → Telegram notification.
// Receives Vercel deployment events and posts a formatted message to a
// Telegram chat via the Bot API.
//
// Required env vars (set in Vercel project → Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN  – from @BotFather
//   TELEGRAM_CHAT_ID    – your private chat id with the bot

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ error: 'Telegram env vars missing' });
  }

  const event = req.body || {};
  const type = event.type || 'unknown';

  // Only relay deployment-related events we care about.
  const relevant = [
    'deployment.created',
    'deployment.succeeded',
    'deployment.ready',
    'deployment.error',
    'deployment.canceled',
  ];
  if (!relevant.includes(type)) {
    return res.status(200).json({ ok: true, ignored: type });
  }

  const d = event.payload?.deployment || {};
  const project = event.payload?.project?.name || event.payload?.name || 'project';
  const url = d.url ? `https://${d.url}` : null;
  const target = d.target || d.meta?.target || 'preview';
  const ref = d.meta?.githubCommitRef || d.gitSource?.ref || '';
  const sha = (d.meta?.githubCommitSha || d.gitSource?.sha || '').slice(0, 7);
  const commitMsg = d.meta?.githubCommitMessage || '';

  const icon = {
    'deployment.created':   '🛠️',
    'deployment.succeeded': '✅',
    'deployment.ready':     '🚀',
    'deployment.error':     '❌',
    'deployment.canceled':  '⚠️',
  }[type] || '📦';

  const label = type.replace('deployment.', '');

  const lines = [
    `${icon} *${project}* — \`${label}\``,
    target === 'production' ? '🌐 *PROD*' : `🧪 preview (${target})`,
    ref ? `🌿 \`${ref}\`${sha ? ` · \`${sha}\`` : ''}` : (sha ? `🔑 \`${sha}\`` : null),
    commitMsg ? `📝 ${commitMsg.split('\n')[0].slice(0, 120)}` : null,
    url ? `🔗 ${url}` : null,
  ].filter(Boolean);

  const text = lines.join('\n');

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      return res.status(500).json({ error: 'Telegram API error', detail: tgData });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'fetch failed', message: String(e) });
  }
}
