import { promises as fs } from 'fs';
import axios from 'axios';
const { proto, generateWAMessageFromContent, generateWAMessageContent } = (await import("@whiskeysockets/baileys")).default;

const charactersFilePath = './src/database/characters.json';

// 📌 Función para cargar JSON de forma segura
async function loadJSON(filePath, defaultValue = []) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return defaultValue;
    }
}

let handler = async (m, { conn, args }) => {
    try {
        const characters = await loadJSON(charactersFilePath, []);
        let userId;

        // 🔹 Identificar el usuario objetivo
        if (m.quoted && m.quoted.sender) {
            userId = m.quoted.sender;
        } else if (args[0] && args[0].startsWith('@')) {
            userId = args[0].replace('@', '') + "@s.whatsapp.net";
        } else {
            userId = m.sender;
        }

        // 🔹 Obtener personajes del usuario
        let userCharacters = characters.filter(character => character.user === userId);

        if (userCharacters.length === 0) {
            return await conn.reply(m.chat, `❀ @${userId.split('@')[0]} no tiene personajes reclamados en su harem.`, m, { mentions: [userId] });
        }

        // 🔹 Ordenar personajes por valor (de mayor a menor)
        userCharacters.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

        // 🔥 Carrusel con los 5 personajes más valiosos
        let topCharacters = userCharacters.slice(0, 5);
        let results = [];
        let omittedCharacters = []; // 🔥 Lista de personajes sin imagen

        for (let character of topCharacters) {
            if (!character.img || character.img.length === 0 || !character.img[0].startsWith("http")) {
                omittedCharacters.push(character.name);
                continue;
            }

            let imageMessage = await generateWAMessageContent(
                { image: { url: character.img[0] } }, 
                { upload: conn.waUploadToServer }
            );

            results.push({
                body: proto.Message.InteractiveMessage.Body.create({ 
                    text: `💠 *Valor:* ${character.value}`
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({ text: "Harem - Personajes Destacados" }),
                header: proto.Message.InteractiveMessage.Header.create({
                    title: `${character.name} - ${character.gender}`, 
                    hasMediaAttachment: true,
                    imageMessage: imageMessage.imageMessage // 📌 Usa el mismo sistema que el código de Pinterest
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: [] }) // ❌ Sin botones
            });
        }

        if (results.length > 0) {
            const responseMessage = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: `🌸 *Top 5 personajes de @${userId.split('@')[0]}*` }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: "⪛✰ Harem - Destacados ✰⪜" }),
                            header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards: results })
                        })
                    }
                }
            }, { quoted: m });

            await conn.relayMessage(m.chat, responseMessage.message, { messageId: responseMessage.key.id });
        }

        // 🔹 Avisar qué personajes fueron omitidos
        if (omittedCharacters.length > 0) {
            let omittedMessage = "⚠️ *Personajes omitidos (sin imagen):*\n";
            omittedMessage += omittedCharacters.map(name => `- ${name}`).join("\n");
            await conn.reply(m.chat, omittedMessage, m);
        }

        // 🔹 Comprobar si el usuario busca un personaje específico
        if (args.length > 1 && isNaN(args[1])) {
            const searchQuery = args.slice(1).join(' ').toLowerCase();
            const foundCharacter = userCharacters.find(c => c.name.toLowerCase().includes(searchQuery));

            if (foundCharacter) {
                return await conn.reply(m.chat, 
                    `🔍 *${foundCharacter.name}* está en el harem de @${userId.split('@')[0]}.\n` +
                    `💠 *Valor:* ${foundCharacter.value}\n🗳️ *Votos:* ${foundCharacter.votes || 0}`,
                    m, { mentions: [userId] }
                );
            } else {
                return await conn.reply(m.chat, `❌ No se encontró *${searchQuery}* en el harem de @${userId.split('@')[0]}.`, m);
            }
        }

        // 🔹 Configurar paginación
        const page = args[1] && !isNaN(args[1]) ? Math.max(1, parseInt(args[1])) : 1;
        const charactersPerPage = 20;
        const totalCharacters = userCharacters.length;
        const totalPages = Math.ceil(totalCharacters / charactersPerPage);

        if (page > totalPages) {
            return await conn.reply(m.chat, `❀ Página inválida. Solo hay *${totalPages}* páginas disponibles.`, m);
        }

        const startIndex = (page - 1) * charactersPerPage;
        const endIndex = Math.min(startIndex + charactersPerPage, totalCharacters);

        // 🔹 Construir mensaje con los personajes de la página actual
        let message = `✿ *HAREM de @${userId.split('@')[0]}* ✿\n`;
        message += `💠 *Total de personajes:* ${totalCharacters}\n`;
        message += `📖 *Página ${page} de ${totalPages}*\n\n`;

        for (let i = startIndex; i < endIndex; i++) {
            const character = userCharacters[i];
            message += `*${i + 1}.* *${character.name}* - 💎 *${character.value}* (${character.votes || 0} votos)\n`;
        }

        message += `\n📌 Para ver más personajes, usa: *#harem ${page + 1}*`;

        // 🔹 Enviar mensaje con paginación
        await conn.reply(m.chat, message, m, { mentions: [userId] });

    } catch (error) {
        await conn.reply(m.chat, `✘ Error al cargar el harem: ${error.message}`, m);
    }
};

handler.help = ['harem [@usuario] [pagina]'];
handler.tags = ['anime'];
handler.command = ['harem', 'claims', 'waifus'];
handler.group = true;
handler.register = true;

export default handler;
