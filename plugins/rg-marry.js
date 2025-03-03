let handler = async (m, { conn, args }) => {
    let userId = m.sender;
    let mentionedUsers = m.mentionedJid || [];

    if (!mentionedUsers.length) {
        return await conn.reply(m.chat, `✧ Debes mencionar a alguien para casarte.\nEjemplo: *#marry @usuario*`, m);
    }

    let partnerId = mentionedUsers[0];

    if (!global.db.data.users[userId]) global.db.data.users[userId] = {};
    if (!global.db.data.users[partnerId]) global.db.data.users[partnerId] = {};

    if (global.db.data.users[userId].marry) {
        return await conn.reply(m.chat, `✧ Ya estás casado/a con *@${global.db.data.users[userId].marry.split('@')[0]}*.\nUsa *#divorce* para divorciarte.`, m, { mentions: [global.db.data.users[userId].marry] });
    }

    if (global.db.data.users[partnerId].marry) {
        return await conn.reply(m.chat, `✧ @${partnerId.split('@')[0]} ya está casado/a con *@${global.db.data.users[partnerId].marry.split('@')[0]}*`, m, { mentions: [partnerId, global.db.data.users[partnerId].marry] });
    }

    if (userId === partnerId) {
        return await conn.reply(m.chat, '✧ ¡No puedes casarte contigo mismo/a!', m);
    }

    global.db.data.users[userId].marry = partnerId;
    global.db.data.users[partnerId].marry = userId;

    await conn.reply(m.chat, `💍 ¡Felicidades! *@${userId.split('@')[0]}* y *@${partnerId.split('@')[0]}* ahora están casados.`, m, { mentions: [userId, partnerId] });
};

handler.help = ['marry @usuario'];
handler.tags = ['fun'];
handler.command = ['marry'];
handler.group = true;
handler.register = true;

export default handler;
