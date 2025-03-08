import { promises as fs } from 'fs';

const charactersFilePath = './src/database/characters.json';
const haremFilePath = './src/database/harem.json';

function normalizeText(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .toLowerCase()
        .trim();
}

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error('No se pudo cargar el archivo characters.json.');
    }
}

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

let handler = async (m, { conn, args }) => {
    if (args.length === 0) {
        await conn.reply(m.chat, '《✧》Debes especificar un personaje para ver su información.\n> Ejemplo » *#winfo Aika Sano*', m);
        return;
    }

    const inputName = normalizeText(args.join(' '));

    try {
        const characters = await loadCharacters();

        const formattedCharacters = characters.map(character => ({
            ...character,
            searchTokens: normalizeText(character.name).split(' ').sort().join(' ') 
        }));

        const character = formattedCharacters.find(c => {
            const inputSorted = inputName.split(' ').sort().join(' ');
            return c.searchTokens === inputSorted;
        });

        if (!character) {
            await conn.reply(m.chat, `《✧》No se encontró el personaje *${args.join(' ')}*.`, m);
            return;
        }

        const harem = await loadHarem();
        const userEntry = harem.find(entry => entry.characterId === character.id);
        const statusMessage = userEntry 
            ? `Reclamado por @${userEntry.userId.split('@')[0]}` 
            : 'Libre';

        const message = `🆔 ID » *${character.id}*\n❀ Nombre » *${character.name}*\n⚥ Género » *${character.gender}*\n✰ Valor » *${character.value}*\n♡ Estado » ${statusMessage}\n❖ Fuente » *${character.source}*`;

        await conn.reply(m.chat, message, m, { mentions: [userEntry ? userEntry.userId : null] });
    } catch (error) {
        await conn.reply(m.chat, `✘ Error al cargar la información del personaje: ${error.message}`, m);
    }
};

handler.help = ['charinfo <nombre del personaje>', 'winfo <nombre del personaje>', 'waifuinfo <nombre del personaje>'];
handler.tags = ['anime'];
handler.command = ['charinfo', 'winfo', 'waifuinfo'];
handler.group = true;
handler.register = true;

export default handler;
