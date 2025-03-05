import fs from 'fs';

const charactersFile = './src/database/characters.json';

const obtenerPersonajes = () => {
    if (fs.existsSync(charactersFile)) {
        return JSON.parse(fs.readFileSync(charactersFile, 'utf-8'));
    }
    return [];
};

const guardarPersonajes = (data) => {
    fs.writeFileSync(charactersFile, JSON.stringify(data, null, 2));
};

let handler = async (m, { conn, text }) => {
    try {
        if (!text.includes('|')) {
            return await conn.reply(m.chat, "⚠️ Usa el formato:\n\n" +
                "`#addchar Nombre | Género | Origen | URL_Imagen1,URL_Imagen2,...`", m);
        }

        let [name, gender, source, imgLinks] = text.split('|').map(p => p.trim());

        if (!name || !gender || !source || !imgLinks) {
            return await conn.reply(m.chat, "⚠️ Faltan datos. Asegúrate de incluir el nombre, género, origen y al menos una imagen.", m);
        }

        let imgArray = imgLinks.split(',').map(url => url.trim()).filter(url => url);

        if (imgArray.length === 0) {
            return await conn.reply(m.chat, "⚠️ Debes proporcionar al menos una URL de imagen válida.", m);
        }

        let personajes = obtenerPersonajes();

        if (personajes.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            return await conn.reply(m.chat, `⚠️ El personaje *${name}* ya existe en la base de datos.`, m);
        }

        let nuevoId = (personajes.length > 0) ? (parseInt(personajes[personajes.length - 1].id) + 1).toString() : "1";

        let nuevoPersonaje = {
            id: nuevoId,
            name: name,
            gender: gender,
            value: "100",
            source: source,
            img: imgArray,
            vid: [], 
            user: null,
            status: "Libre",
            votes: 0
        };

        personajes.push(nuevoPersonaje);
        guardarPersonajes(personajes);

        await conn.reply(m.chat, `✅ *Personaje agregado con éxito*\n\n` +
            `📌 *Nombre:* ${name}\n` +
            `⚥ *Género:* ${gender}\n` +
            `📖 *Origen:* ${source}\n` +
            `🆔 *ID:* ${nuevoId}\n` +
            `🖼 *Imágenes:* ${imgArray.length}`, m);

    } catch (error) {
        console.error("❌ Error en el handler:", error);
        await conn.reply(m.chat, "❌ Ocurrió un error al agregar el personaje.", m);
    }
};

handler.help = ['addchar'];
handler.tags = ['gacha'];
handler.command = ['addchar'];
handler.group = true;
handler.admin = true; 

export default handler;
