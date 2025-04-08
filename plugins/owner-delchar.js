import { promises as fs } from 'fs';

const CHARACTERS_FILE = './src/database/characters.json';
const HAREM_FILE = './src/database/harem.json';

function normalizarNombre(nombre) {
    return nombre
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\([^)]*\)/g, "")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim();
}

async function loadJSON(filePath, defaultValue = []) {
    try {
        if (!(await fs.stat(filePath).catch(() => false))) return defaultValue;
        const data = await fs.readFile(filePath, 'utf-8');
        return data.trim() ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`❌ Error al leer ${filePath}:`, error);
        return defaultValue;
    }
}

async function saveJSON(filePath, data) {
    try {
        const tempFilePath = filePath + ".tmp";
        await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf-8');
        await fs.rename(tempFilePath, filePath);
    } catch (error) {
        console.error(`❌ Error al guardar ${filePath}:`, error);
    }
}

let pendingConfirmations = new Map(); 

let handler = async (m, { conn, args }) => {
    if (!args.length) {
        return conn.reply(m.chat, '❌ Debes especificar el nombre o ID del personaje a eliminar.', m);
    }

    let personajes = await loadJSON(CHARACTERS_FILE);
    let harem = await loadJSON(HAREM_FILE);

    let busqueda = args.join(' ').trim();
    let personaje = personajes.find(p => p.id === busqueda || normalizarNombre(p.name) === normalizarNombre(busqueda));

    if (!personaje) {
        return conn.reply(m.chat, `❌ No se encontró el personaje "*${busqueda}*".`, m);
    }

    pendingConfirmations.set(m.sender, { chat: m.chat, personaje });

    return conn.reply(m.chat, `⚠️ ¿Seguro que deseas eliminar a *${personaje.name}* (${personaje.id})? Responde con *CONFIRMAR* para proceder.`, m);
};

let confirmHandler = async (m, { conn }) => {
    if (!pendingConfirmations.has(m.sender)) return;
    
    let { chat, personaje } = pendingConfirmations.get(m.sender);

    if (normalizarNombre(m.text) !== 'confirmar') {
        pendingConfirmations.delete(m.sender);
        return conn.reply(chat, '❌ Eliminación cancelada.', m);
    }

    let personajes = await loadJSON(CHARACTERS_FILE);
    let harem = await loadJSON(HAREM_FILE);

    let nuevosPersonajes = personajes.filter(p => p.id !== personaje.id);
    let nuevoHarem = harem.filter(h => h.characterId !== personaje.id);

    await saveJSON(CHARACTERS_FILE, nuevosPersonajes);
    await saveJSON(HAREM_FILE, nuevoHarem);

    pendingConfirmations.delete(m.sender); 

    return conn.reply(chat, `✅ *${personaje.name}* (${personaje.id}) ha sido eliminado correctamente.`, m);
};

handler.before = confirmHandler;

handler.help = ['deletechar <nombre/ID>'];
handler.command = ['deletechar', 'removechar', 'delchar'];
handler.tags = ['owner'];
handler.rowner = true;

export default handler;
