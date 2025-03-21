import { promises as fs } from 'fs';

const charactersFilePath = './src/database/characters.json';
const haremFilePath = './src/database/harem.json';
const cooldowns = {};
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

    if ((cooldowns[userId] ?? 0) > now) {
        const remainingTime = Math.ceil((cooldowns[userId] - now) / 1000);
        return await conn.reply(m.chat, `⏳ *Debes esperar ${Math.floor(remainingTime / 60)} minutos y ${remainingTime % 60} segundos para reclamar de nuevo.*`, m);
    }

    if (!m.quoted || m.quoted.sender !== conn.user.jid) {
        return await conn.reply(m.chat, '❀ *Debes citar un mensaje con un personaje válido para reclamar.*', m);
    }

    try {
        let characters = await loadJSON(charactersFilePath);
        let harem = await loadJSON(haremFilePath);

        let characterIdMatch = m.quoted.text.match(/> 𝐈𝐃:\s*(\d+)/);
        if (!characterIdMatch) {
            return await conn.reply(m.chat, '❀ *No se pudo encontrar el ID del personaje en el mensaje citado.*', m);
        }

        const characterId = characterIdMatch[1];
        let character = characters.find(c => c.id === characterId);

        if (!character) {
            return await conn.reply(m.chat, '❀ *El mensaje citado no corresponde a un personaje válido.*', m);
        }

        if (reservaPersonajes[characterId]) {
            let { reservadoPor, expiraEn } = reservaPersonajes[characterId];

            if (now < expiraEn && userId !== reservadoPor) {
                return await conn.reply(m.chat, `⏳ *Este personaje está reservado por otro usuario hasta que pasen 10 segundos.*`, m);
            }
        }

        if (character.user) {
            return await conn.reply(m.chat, `⚠️ *${character.name} ya ha sido reclamado por otro usuario.*`, m);
        }

        const animaciones = [
            `_🤔 ${character.name} te observa detenidamente..._`,
            `_😲 Parece sorprendido de que intentes reclamarlo..._`,
            `_💭 ${character.name} está pensando en si aceptarte como su dueño..._`,
            `_💫 Algo mágico está sucediendo..._`
        ];

        let { key } = await conn.sendMessage(m.chat, { text: animaciones[0] }, { quoted: m });

        for (let i = 1; i < animaciones.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1200)); 
            await conn.sendMessage(m.chat, { text: animaciones[i], edit: key });
        }

        let rechaza = Math.random() < 0.05;

        if (rechaza) {
            const respuestasRechazo = [
                `*${character.name} niega con la cabeza y se aleja...*`,
                `*${character.name} dice: "Lo siento, pero no estoy listo para unirme a nadie."*`,
                `*${character.name} desaparece en una nube de energía, rechazando tu petición...*`
            ];
            let respuestaRechazo = respuestasRechazo[Math.floor(Math.random() * respuestasRechazo.length)];

            await new Promise(resolve => setTimeout(resolve, 1500));
            return await conn.sendMessage(m.chat, { text: `💔 *¡Oh no! ${character.name} ha rechazado tu intento de reclamarlo...*\n\n${respuestaRechazo}`, edit: key });
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
                voteCooldown: now + 600000 
            });
        }
        await saveJSON(haremFilePath, harem);

        let genero = (character.gender || "desconocido").toLowerCase();

        let respuestasMasculino = [
            `*${character.name} asiente con una sonrisa confiada.*`,
            `*${character.name} acepta ser tuyo con una mirada decidida.*`,
            `*${character.name} se cruza de brazos y dice: "No esperaba menos de ti."*`,
            `*${character.name} se inclina hacia ti y susurra: "Siempre estaré a tu lado."*`,
            `*${character.name} lanza una broma y ríe: "¿Creías que me asustarías tan fácil?"*`,
            `*${character.name} te mira intensamente y dice: "Eres más fuerte de lo que piensas."*`
        ];
        let respuestasFemenino = [
            `*${character.name} se sonroja y acepta ser tuya con timidez.*`,
            `*${character.name} sonríe con alegría y corre hacia ti.*`,
            `*${character.name} te mira con dulzura y susurra: "Cuidaré de ti..."*`,
            `*${character.name} juega con su cabello y dice: "Nunca había sentido esto antes."*`,
            `*${character.name} te abraza con fuerza y dice: "No te dejaré ir."*`,
            `*${character.name} te lanza una mirada pícara y dice: "¿Quién diría que serías tan encantador?"*`
        ];
        let respuestasNeutro = [
            `*${character.name} flota en el aire y se acerca lentamente.*`,
            `*${character.name} te observa en silencio antes de asentir.*`,
            `*${character.name} parpadea y dice: "Parece que el destino nos ha unido."*`,
            `*${character.name} se sienta a tu lado y dice: "La vida es más interesante contigo."*`,
            `*${character.name} sonríe enigmáticamente y dice: "A veces, las mejores sorpresas son inesperadas."*`,
            `*${character.name} se inclina hacia ti y susurra: "Tú y yo, somos un misterio por resolver."*`
        ];

        let respuestaFinal;
        if (genero.includes("hombre") || genero.includes("masculino")) {
            respuestaFinal = respuestasMasculino[Math.floor(Math.random() * respuestasMasculino.length)];
        } else if (genero.includes("mujer") || genero.includes("femenino")) {
            respuestaFinal = respuestasFemenino[Math.floor(Math.random() * respuestasFemenino.length)];
        } else {
            respuestaFinal = respuestasNeutro[Math.floor(Math.random() * respuestasNeutro.length)];
        }

        let mensajeFinal = `🎉 *¡Felicidades!\n* Has reclamado a ${character.name} con éxito.*\n` +
                           `> ${respuestaFinal}`;

        await new Promise(resolve => setTimeout(resolve, 1500));
        await conn.sendMessage(m.chat, { text: mensajeFinal, edit: key });

        cooldowns[userId] = now + 20 * 60 * 1000;

    } catch (error) {
        return await conn.reply(m.chat, `❌ *Error al reclamar el personaje:* ${error.message}`, m);
    }
};

handler.help = ['claim'];
handler.tags = ['gacha'];
handler.command = ['c', 'claim', 'reclamar'];
handler.group = true;
handler.register = true;

export default handler;
