import fs from 'fs';

const charactersFile = './src/database/characters.json';

const obtenerPersonajes = () => {
    if (fs.existsSync(charactersFile)) {
        return JSON.parse(fs.readFileSync(charactersFile, 'utf-8'));
    }
    return [];
};

let handler = async (m, { conn }) => {
    try {
        let personajes = obtenerPersonajes();

        let personajesLibres = personajes.filter(p => p.status === "Libre" && !p.user);

        if (personajesLibres.length === 0) {
            return await conn.reply(m.chat, "🚫 No hay personajes disponibles en este momento.", m);
        }

        let mensaje = `🎉 *Personajes Libres* 🎉\n📌 Total: ${personajesLibres.length}\n\n` +
            personajesLibres.map(p => `📌 *${p.name}*\n⚥ Género: ${p.gender}\n📖 Origen: ${p.source}\n`).join("\n");

        await conn.reply(m.chat, mensaje, m);

    } catch (error) {
        console.error("❌ Error en el handler:", error);
        await conn.reply(m.chat, "❌ Ocurrió un error al mostrar los personajes libres.", m);
    }
};

handler.help = ['wlibres'];
handler.tags = ['gacha'];
handler.command = ['wlibres', 'disponibles'];
handler.group = true;

export default handler;
