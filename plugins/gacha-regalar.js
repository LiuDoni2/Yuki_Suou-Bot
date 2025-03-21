import { promises as fs } from 'fs';

const charactersFilePath = './src/database/characters.json';
const haremFilePath = './src/database/harem.json';

async function loadJSON(filePath, defaultValue = []) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return data.trim() ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`❀ Error cargando ${filePath}: ${error.message}`);
        return defaultValue;
    }
}

async function saveJSON(filePath, data) {
    try {
        const tempFilePath = filePath + ".tmp";
        await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf-8');
        await fs.rename(tempFilePath, filePath);
    } catch (error) {
        console.error(`❀ Error guardando ${filePath}: ${error.message}`);
    }
}

let handler = async (m, { conn, args }) => {
    const userId = m.sender;

    if (args.length < 2) {
        return await conn.reply(m.chat, '🔹 Debes especificar el nombre del personaje y mencionar a quien quieras regalarlo.\n> Ejemplo: *#regalar Rem @usuario*', m);
    }

    const characterName = args.slice(0, -1).join(' ').toLowerCase().trim();
    const mentionedUserArg = args[args.length - 1];

    if (!mentionedUserArg.startsWith('@')) {
        return await conn.reply(m.chat, '❌ Debes mencionar a un usuario válido.', m);
    }

    let mentionedUser = m.mentionedJid?.[0] || mentionedUserArg.replace('@', '') + "@s.whatsapp.net";

    if (mentionedUser === userId) {
        return await conn.reply(m.chat, '⚠️ No puedes regalarte un personaje a ti mismo.', m);
    }

    try {
        const characters = await loadJSON(charactersFilePath, []);
        const harem = await loadJSON(haremFilePath, []);

        const character = characters.find(c => c.name.toLowerCase() === characterName && c.user === userId);

        if (!character) {
            return await conn.reply(m.chat, `⚠️ No puedes regalar *${characterName}* porque no te pertenece.`, m);
        }

        // 🔹 Posibilidad de que el personaje se quede con su dueño
        let seQueda = Math.random() < 0.05; // 5% de probabilidad
        if (seQueda) {
            let frasesRechazo = [
                `*${character.name} sacude la cabeza y dice: "Lo siento... No quiero irme."*`,
                `*${character.name} se aferra a su dueño y se niega a marcharse.*`,
                `*${character.name} dice con lágrimas en los ojos: "¡No quiero un nuevo dueño!"*`
            ];
            return await conn.reply(m.chat, frasesRechazo[Math.floor(Math.random() * frasesRechazo.length)], m);
        }

        // 🔹 Animaciones de despedida
        const animaciones = [
            `_💭 ${character.name} se entera de que será transferido..._`,
            `_😲 Parece sorprendido por la noticia..._`,
            `_😢 ${character.name} mira a su dueño con nostalgia..._`,
            `_✨ Se está preparando para su nuevo hogar..._`
        ];

        let { key } = await conn.sendMessage(m.chat, { text: animaciones[0] }, { quoted: m });

        for (let i = 1; i < animaciones.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await conn.sendMessage(m.chat, { text: animaciones[i], edit: key });
        }

        // 🔹 Transferir personaje
        const existingEntry = harem.find(entry => entry.characterId === character.id);
        if (existingEntry) {
            existingEntry.userId = mentionedUser;
            existingEntry.lastClaimTime = Date.now();
        } else {
            harem.push({ userId: mentionedUser, characterId: character.id, lastClaimTime: Date.now() });
        }

        character.user = mentionedUser;
        await saveJSON(charactersFilePath, characters);
        await saveJSON(haremFilePath, harem);

        // 🔹 Respuestas personalizadas según el género
        let genero = (character.gender || "desconocido").toLowerCase();
        let respuestasMasculino = [
            `*${character.name} te da una palmada en la espalda y se despide.*`,
            `*${character.name} asiente con una sonrisa y se va con su nuevo dueño.*`,
            `*${character.name} dice: "Espero que mi nuevo dueño me trate bien."*`
        ];
        let respuestasFemenino = [
            `*${character.name} te da un abrazo de despedida y se sonroja.*`,
            `*${character.name} sonríe con dulzura y dice: "Espero que me quieran..."*`,
            `*${character.name} susurra: "Voy a extrañarte..." antes de marcharse.*`
        ];
        let respuestasNeutro = [
            `*${character.name} observa a su nuevo dueño y asiente con determinación.*`,
            `*${character.name} flota hacia su nueva vida, dejando una sensación de nostalgia.*`,
            `*${character.name} murmura: "Un nuevo comienzo..." y se marcha.*`
        ];

        let respuestaFinal;
        if (genero.includes("hombre") || genero.includes("masculino")) {
            respuestaFinal = respuestasMasculino[Math.floor(Math.random() * respuestasMasculino.length)];
        } else if (genero.includes("mujer") || genero.includes("femenino")) {
            respuestaFinal = respuestasFemenino[Math.floor(Math.random() * respuestasFemenino.length)];
        } else {
            respuestaFinal = respuestasNeutro[Math.floor(Math.random() * respuestasNeutro.length)];
        }

        let mensajeFinal = `🎁 *¡Transferencia completada!* 🎁\n\n` +
                           `✨ *${character.name}* ha sido regalado a @${mentionedUser.split('@')[0]}.\n\n` +
                           `${respuestaFinal}`;

        await new Promise(resolve => setTimeout(resolve, 1500));
        await conn.sendMessage(m.chat, { text: mensajeFinal, edit: key, mentions: [mentionedUser] });

    } catch (error) {
        console.error(`❀ Error en handler: ${error.message}`);
        await conn.reply(m.chat, `❌ Error al regalar el personaje: ${error.message}`, m);
    }
};

handler.help = ['regalar <nombre del personaje> @usuario'];
handler.tags = ['gacha'];
handler.command = ['regalar', 'givewaifu', 'givechar'];
handler.group = true;
handler.register = true;

export default handler;
