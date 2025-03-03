import fs from 'fs';
import path from 'path';

const marriagesFile = path.resolve('./src/database/casados.json');
let proposals = {};

function loadMarriages() {
    if (fs.existsSync(marriagesFile)) {
        const data = fs.readFileSync(marriagesFile, 'utf-8');
        return JSON.parse(data);
    } else return {};
}

function saveMarriages(data) {
    fs.writeFileSync(marriagesFile, JSON.stringify(data, null, 2));
}

let marriages = loadMarriages();

let handler = async (m, { conn, command, usedPrefix, args }) => {
    let userId = m.sender;
    let mentionedUsers = m.mentionedJid || [];

    if (command === 'marry') {
        if (!mentionedUsers.length) {
            return await conn.reply(m.chat, `✧ Debes mencionar a alguien para proponer matrimonio.\nEjemplo: *${usedPrefix}marry @usuario*`, m);
        }

        let partner = mentionedUsers[0];

        if (marriages[userId]) {
            return await conn.reply(m.chat, `✧ Ya estás casado/a con *@${marriages[userId].split('@')[0]}*\nUsa *${usedPrefix}divorce* para divorciarte.`, m, { mentions: [marriages[userId]] });
        }

        if (marriages[partner]) {
            return await conn.reply(m.chat, `✧ @${partner.split('@')[0]} ya está casado/a con *@${marriages[partner].split('@')[0]}*`, m, { mentions: [partner, marriages[partner]] });
        }

        if (userId === partner) {
            return await conn.reply(m.chat, '✧ ¡No puedes casarte contigo mismo/a!', m);
        }

        if (proposals[partner] && proposals[partner] === userId) {
            delete proposals[partner];
            marriages[userId] = partner;
            marriages[partner] = userId;
            saveMarriages(marriages);

            return await conn.reply(m.chat, `🎉 ¡Felicidades! *@${userId.split('@')[0]}* y *@${partner.split('@')[0]}* se han casado. 💍`, m, { mentions: [userId, partner] });
        } else {
            proposals[userId] = partner;
            return await conn.reply(m.chat, `💕 @${partner.split('@')[0]}, @${userId.split('@')[0]} te ha propuesto matrimonio. ¿Aceptas?\nResponde con *${usedPrefix}marry @${userId.split('@')[0]}* para aceptar.`, m, { mentions: [userId, partner] });
        }
    }

    if (command === 'divorce') {
        if (!marriages[userId]) {
            return await conn.reply(m.chat, '✧ No estás casado/a con nadie.', m);
        }

        let exPartner = marriages[userId];
        delete marriages[userId];
        delete marriages[exPartner];
        saveMarriages(marriages);

        return await conn.reply(m.chat, `💔 @${userId.split('@')[0]} y @${exPartner.split('@')[0]} se han divorciado. 😢`, m, { mentions: [userId, exPartner] });
    }
};

handler.help = ['marry @usuario', 'divorce'];
handler.tags = ['fun'];
handler.command = ['marry', 'divorce'];
handler.group = true;
handler.register = true;

export default handler;
