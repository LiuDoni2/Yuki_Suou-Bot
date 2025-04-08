import { promises as fs } from 'fs';

const CHARACTERS_FILE = './src/database/characters.json';
const HAREM_FILE = './src/database/harem.json';

// Función para normalizar nombres
function normalizarNombre(nombre) {
    return nombre
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\([^)]*\)/g, "")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .trim();
}

// Cargar JSON de forma segura
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

// Guardar JSON de forma segura
async function saveJSON(filePath, data) {
    try {
        const tempFilePath = filePath + ".tmp";
        await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf-8');
        await fs.rename(tempFilePath, filePath);
    } catch (error) {
        console.error(`❌ Error al guardar ${filePath}:`, error);
    }
}

let pendingConfirmations = new Map(); // Almacena confirmaciones pendientes

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

    // Guardar en la lista de confirmaciones pendientes
    pendingConfirmations.set(m.sender, { chat: m.chat, personaje });

    // Enviar mensaje de confirmación
    return conn.reply(m.chat, `⚠️ ¿Seguro que deseas eliminar a *${personaje.name}* (${personaje.id})? Responde con *CONFIRMAR* para proceder.`, m);
};

// Manejador de confirmación
let confirmHandler = async (m, { conn }) => {
    if (!pendingConfirmations.has(m.sender)) return;
    
    let { chat, personaje } = pendingConfirmations.get(m.sender);

    if (normalizarNombre(m.text) !== 'confirmar') {
        pendingConfirmations.delete(m.sender);
        return conn.reply(chat, '❌ Eliminación cancelada.', m);
    }

    // Cargar datos
    let personajes = await loadJSON(CHARACTERS_FILE);
    let harem = await loadJSON(HAREM_FILE);

    // Eliminar personaje
    let nuevosPersonajes = personajes.filter(p => p.id !== personaje.id);
    let nuevoHarem = harem.filter(h => h.characterId !== personaje.id);

    // Guardar cambios
    await saveJSON(CHARACTERS_FILE, nuevosPersonajes);
    await saveJSON(HAREM_FILE, nuevoHarem);

    pendingConfirmations.delete(m.sender); // Eliminar confirmación pendiente

    return conn.reply(chat, `✅ *${personaje.name}* (${personaje.id}) ha sido eliminado correctamente.`, m);
};

// Registrar confirmHandler como manejador global de mensajes
handler.before = confirmHandler;

handler.help = ['deletechar <nombre/ID>'];
handler.command = ['deletechar', 'removechar', 'delchar'];
handler.tags = ['owner'];
handler.rowner = true;

export default handler;
