import { promises as fs } from 'fs';

const charactersFilePath = './src/database/characters.json';

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
        throw new Error('❀ No se pudo cargar el archivo characters.json.');
    }
}

let handler = async (m, { conn, args }) => {
    if (args.length === 0) {
        await conn.reply(m.chat, '《✧》Debes especificar un personaje para ver su imagen.\n> Ejemplo » *#wimage Aika Sano*', m);
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
            await conn.reply(m.chat, `《✧》No se ha encontrado el personaje *${args.join(' ')}*. Asegúrate de que el nombre esté correcto.`, m);
            return;
        }

        if (!character.img || character.img.length === 0) {
            await conn.reply(m.chat, `《✧》No hay imágenes disponibles para *${character.name}*.`, m);
            return;
        }

        const randomImage = character.img[Math.floor(Math.random() * character.img.length)];

        const message = `🆔 ID » *${character.id}*\n❀ Nombre » *${character.name}*\n⚥ Género » *${character.gender}*\n❖ Fuente » *${character.source}*`;

        await conn.sendFile(m.chat, randomImage, `${character.name}.jpg`, message, m);
    } catch (error) {
        await conn.reply(m.chat, `✘ Error al cargar la imagen del personaje: ${error.message}`, m);
    }
};

handler.help = ['wimage <nombre del personaje>'];
handler.tags = ['anime'];
handler.command = ['charimage', 'cimage', 'wimage', 'waifuimage'];
handler.group = true;
handler.register = true;

export default handler;
