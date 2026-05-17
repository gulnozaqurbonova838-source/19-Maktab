function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({
            ok: false,
            error: 'Server sozlanmagan. TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID ni qo‘ying.',
        });
    }

    const { name, email, message } = req.body || {};

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
        return res.status(400).json({ ok: false, error: 'Barcha maydonlar to‘ldirilishi shart.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
        return res.status(400).json({ ok: false, error: 'Email noto‘g‘ri.' });
    }

    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeMessage = escapeHtml(message.trim());

    const telegramMessage = `
📬 <b>Yangi Xabar</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Ism:</b> ${safeName}
📧 <b>Email:</b> ${safeEmail}
💬 <b>Xabar:</b> ${safeMessage}
⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}
`;

    try {
        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: telegramMessage,
                    parse_mode: 'HTML',
                }),
            }
        );

        const data = await telegramResponse.json();

        if (!data.ok) {
            console.error('Telegram API error:', data);
            return res.status(502).json({ ok: false, error: 'Telegram xabarini yuborib bo‘lmadi.' });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Contact handler error:', error);
        return res.status(500).json({ ok: false, error: 'Server xatosi.' });
    }
};
