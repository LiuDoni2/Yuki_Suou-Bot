import { promises as fs } from 'fs';
import { getCooldown, setCooldown } from './cooldowns.js';

const charactersFilePath = './src/database/characters.json';
const haremFilePath = './src/database/harem.json';
const cooldowns = 30 * 60 * 1000;
const reservaPersonajes = {}; 

async function loadJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return data.trim() ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`❀ Error cargando ${filePath}: ${error.message}`);
        return [];
    }
}

async function saveJSON(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`❀ Error guardando ${filePath}: ${error.message}`);
    }
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();
    const userName = await conn.getName(userId) || 'Usuario'; 

    const lastClaimTime = await getCooldown(userId, "claim") || 0;

    if (lastClaimTime > now) {
        const remainingTime = Math.ceil((lastClaimTime - now) / 1000);
        return await conn.reply(
            m.chat,
            `⏳ *${userName}, debes esperar ${Math.floor(remainingTime / 60)} minutos y ${remainingTime % 60} segundos para reclamar de nuevo.*`,
            m
        );
    }

    if (!m.quoted || m.quoted.sender !== conn.user.jid) {
        return await conn.reply(m.chat, `❀ *${userName}, debes citar un mensaje con un personaje válido para reclamar.*`, m);
    }

    try {
        let characters = await loadJSON(charactersFilePath);
        let harem = await loadJSON(haremFilePath);

        let characterIdMatch = m.quoted.text.match(/> 𝐈𝐃:\s*(\d+)/);
        if (!characterIdMatch) {
            return await conn.reply(m.chat, `❀ *${userName}, no se pudo encontrar el ID del personaje en el mensaje citado.*`, m);
        }

        const characterId = characterIdMatch[1];
        let character = characters.find(c => c.id === characterId);

        if (!character) {
            return await conn.reply(m.chat, `❀ *${userName}, el mensaje citado no corresponde a un personaje válido.*`, m);
        }

        if (reservaPersonajes[characterId]) {
            let { reservadoPor, expiraEn } = reservaPersonajes[characterId];
            if (now < expiraEn && userId !== reservadoPor) {
                return await conn.reply(
                    m.chat,
                    `⏳ *${userName}, este personaje está reservado por otro usuario hasta que pasen 10 segundos.*`,
                    m
                );
            }
        }

        if (character.user) {
            return await conn.reply(m.chat, `⚠️ *${userName}, ${character.name} ya ha sido reclamado por otro usuario.*`, m);
        }

        await setCooldown(userId, "claim", now + cooldowns);

        const animaciones = [
            `_🤔 ${character.name} te observa detenidamente, ${userName}..._`,
            `_😲 Parece sorprendido de que intentes reclamarlo, ${userName}..._`,
            `_💭 ${character.name} está pensando en si aceptarte como su dueño, ${userName}..._`,
            `_💫 Algo mágico está sucediendo..._`
        ];

        let { key } = await conn.sendMessage(m.chat, { text: animaciones[0] }, { quoted: m });

        for (let i = 1; i < animaciones.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1200)); 
            await conn.sendMessage(m.chat, { text: animaciones[i], edit: key });
        }

        let rechaza = Math.random() < 0.10;

        if (rechaza) {
            const respuestasRechazo = [
                `*${character.name} niega con la cabeza y se aleja de ${userName}...*`,
                `*${character.name} dice: "Lo siento, ${userName}, pero no estoy listo para unirme a nadie."*`,
                `*${character.name} desaparece en una nube de energía, rechazando la petición de ${userName}...*`
            ];
            let respuestaRechazo = respuestasRechazo[Math.floor(Math.random() * respuestasRechazo.length)];

            await new Promise(resolve => setTimeout(resolve, 1500));
            return await conn.sendMessage(m.chat, { text: `💔 *¡Oh no, ${userName}! ${character.name} ha rechazado tu intento de reclamarlo...*\n\n${respuestaRechazo}`, edit: key });
        }

        character.user = userId;
        await saveJSON(charactersFilePath, characters);

        let haremEntry = harem.find(h => h.characterId === characterId);
        if (haremEntry) {
            haremEntry.userId = userId;
        } else {
            harem.push({
                userId,
                characterId,
                lastVoteTime: now,
                voteCooldown: now + 150000 
            });
        }
        await saveJSON(haremFilePath, harem);

        const userHaremCount = harem.filter(h => h.userId === userId).length;

        let mensajeFinal = `🎉 *¡Felicidades, ${userName}!* Has reclamado a ${character.name}.`;

        await new Promise(resolve => setTimeout(resolve, 1500));
        await conn.sendMessage(m.chat, { text: mensajeFinal, edit: key });

    } catch (error) {
        return await conn.reply(m.chat, `❌ *Error al reclamar el personaje, ${userName}:* ${error.message}`, m);
    }
};

handler.help = ['claim'];
handler.tags = ['gacha'];
handler.command = ['c', 'claim', 'reclamar'];
handler.group = true;
handler.register = true;

export default handler;
