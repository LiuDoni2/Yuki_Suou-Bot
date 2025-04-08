import { promises as fs } from 'fs';
import axios from 'axios';
const { proto, generateWAMessageFromContent, generateWAMessageContent } = (await import("@whiskeysockets/baileys")).default;

const charactersFilePath = './src/database/characters.json';

async function loadJSON(filePath, defaultValue = []) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Error al cargar ${filePath}: ${error.message}`);
        return defaultValue;
    }
}

let handler = async (m, { conn, args }) => {
    try {
        const characters = await loadJSON(charactersFilePath, []);
        let userId;

        if (m.quoted && m.quoted.sender) {
            userId = m.quoted.sender;
        } else if (args[0] && args[0].startsWith('@')) {
            userId = args[0].replace('@', '') + "@s.whatsapp.net";
        } else {
            userId = m.sender;
        }

        const targetName = await conn.getName(userId) || userId.split('@')[0]; 

        let userCharacters = characters.filter(character => character.user === userId);

        if (userCharacters.length === 0) {
            return await conn.reply(m.chat, `🌸 *${targetName}* no tiene personajes reclamados en su harem.`, m);
        }

        userCharacters.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

        let topCharacters = userCharacters.slice(0, 5);
        let results = [];
        let omittedCharacters = [];

        for (let character of topCharacters) {
            if (!character.img || character.img.length === 0 || !character.img[0].startsWith("http")) {
                omittedCharacters.push(character.name);
                continue;
            }

            try {
                let imageMessage = await generateWAMessageContent(
                    { image: { url: character.img[0] } },
                    { upload: conn.waUploadToServer }
                );

                results.push({
                    body: proto.Message.InteractiveMessage.Body.create({
                        text: `*💠 Valor:* ${character.value || 'N/A'}\n*♡ Género:* ${character.gender || 'Desconocido'}\n*📖 Origen:* ${character.source || 'Desconocido'}`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: "✿ Harem - Personajes Destacados ✿" }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        title: `${character.name}`,
                        hasMediaAttachment: true,
                        imageMessage: imageMessage.imageMessage
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: [] }) 
                });
            } catch (error) {
                omittedCharacters.push(character.name);
                console.error(`❌ Error al cargar imagen de ${character.name}: ${error.message}`);
            }
        }

        if (results.length > 0) {
            const responseMessage = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: `🌸 *Top 5 personajes de ${targetName}*` }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: "⪛✰ Harem - Destacados ✰⪜" }),
                            header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards: results })
                        })
                    }
                }
            }, { quoted: m });

            await conn.relayMessage(m.chat, responseMessage.message, { messageId: responseMessage.key.id });
        }

        if (omittedCharacters.length > 0) {
            let omittedMessage = "⚠️ *Personajes omitidos (sin imagen):*\n";
            omittedMessage += omittedCharacters.map(name => `- ${name}`).join("\n");
            await conn.reply(m.chat, omittedMessage, m);
        }

        if (args.length > 1 && isNaN(args[1])) {
            const searchQuery = args.slice(1).join(' ').toLowerCase();
            const foundCharacter = userCharacters.find(c => c.name.toLowerCase().includes(searchQuery));

            if (foundCharacter) {
                return await conn.reply(m.chat,
                    `🔍 *${foundCharacter.name}* está en el harem de *${targetName}*.\n` +
                    `💠 *Valor:* ${foundCharacter.value || 'N/A'}\n🗳️ *Votos:* ${foundCharacter.votes || 0}`,
                    m
                );
            } else {
                return await conn.reply(m.chat, `❌ No se encontró "*${searchQuery}*" en el harem de *${targetName}*.`, m);
            }
        }

        const page = args[1] && !isNaN(args[1]) ? Math.max(1, parseInt(args[1])) : 1;
        const charactersPerPage = 20;
        const totalCharacters = userCharacters.length;
        const totalPages = Math.ceil(totalCharacters / charactersPerPage);

        if (page > totalPages) {
            return await conn.reply(m.chat, `❀ Página inválida. Solo hay *${totalPages}* páginas disponibles.`, m);
        }

        const startIndex = (page - 1) * charactersPerPage;
        const endIndex = Math.min(startIndex + charactersPerPage, totalCharacters);
        const totalValue = userCharacters.reduce((sum, c) => sum + (Number(c.value) || 0), 0);

        let message = `✿ *HAREM de ${targetName}* ✿\n\n`;
        message += `💠 *Total de personajes:* ${totalCharacters}\n`;
        message += `💰 *Valor total:* ${totalValue}\n`;
        message += `📖 *Mostrando del ${startIndex + 1} al ${endIndex} de ${totalCharacters}*\n\n`;

        for (let i = startIndex; i < endIndex; i++) {
            const character = userCharacters[i];
            const votos = character.votes || 0;
            message += `*${i + 1}.* *${character.name}* (ID: ${character.id}) - 💎 *Valor:* ${character.value || 'N/A'} (${votos} votos)\n`;
        }

        if (page > 1) {
            message += `\n📌 Página anterior: *#harem ${page - 1}*`;
        }
        if (page < totalPages) {
            message += `${page > 1 ? ' | ' : '\n'}📌 Página siguiente: *#harem ${page + 1}*`;
        }

        await conn.reply(m.chat, message, m);

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
