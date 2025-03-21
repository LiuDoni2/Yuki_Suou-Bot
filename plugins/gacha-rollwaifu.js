import { promises as fs } from 'fs';
import { getCooldown, setCooldown } from './cooldowns.js';

const charactersFilePath = './src/database/characters.json';
const cooldownTime = 20 * 60 * 1000; 
const reservaPersonajes = {}; // Diccionario compartido con `gacha-claim.js`

async function loadJSON(filePath, defaultValue = []) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return data.trim() ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`❀ Error cargando ${filePath}: ${error.message}`);
        return defaultValue;
    }
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (getCooldown(userId, "rollwaifu") > 0) {
        const remainingTime = Math.ceil(getCooldown(userId, "rollwaifu") / 1000);
        return await conn.reply(m.chat, `⏳ *Debes esperar ${Math.floor(remainingTime / 60)} minutos y ${remainingTime % 60} segundos para volver a usar #rw.*`, m);
    }

    try {
        let characters = await loadJSON(charactersFilePath);

        // 🔹 Intentar primero con personajes libres
        let freeCharacters = characters.filter(c => !c.user);
        let randomCharacter = freeCharacters.length > 0 
            ? freeCharacters[Math.floor(Math.random() * freeCharacters.length)]
            : characters[Math.floor(Math.random() * characters.length)]; // Si no hay libres, elegir cualquiera

        if (!randomCharacter.img || randomCharacter.img.length === 0) {
            throw new Error(`El personaje ${randomCharacter.name} no tiene imágenes definidas.`);
        }

        let randomImage = randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)];
        let ext = randomImage.split('.').pop().toLowerCase();
        ext = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";

        let esReclamable = !randomCharacter.user;
        let statusMessage = esReclamable ? "Libre" : `🔒 Reclamado por @${randomCharacter.user.split('@')[0]}`;
        
        if (esReclamable) {
            reservaPersonajes[randomCharacter.id] = {
                reservadoPor: userId,
                expiraEn: now + 15000 
            };
        }

        const animaciones = [
            "_🔮 Invocando un personaje..._",
            "_✨ Explorando el multiverso..._",
            "_📜 Descifrando los datos del personaje..._",
            "_👀 Sientes una presencia acercándose..._",
            `_😲 ¡Un personaje ha aparecido ante ti!_`
        ];

        let { key } = await conn.sendMessage(m.chat, { text: animaciones[0] }, { quoted: m });

        for (let i = 1; i < animaciones.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1200)); 
            await conn.sendMessage(m.chat, { text: animaciones[i], edit: key });
        }

        let genero = (randomCharacter.gender || "desconocido").toLowerCase();

        let reaccionesMasculino = [
            `*${randomCharacter.name} cruza los brazos, esperando un dueño digno...*`,
            `*${randomCharacter.name} te observa con determinación...*`,
            `*${randomCharacter.name} sonríe confiado, esperando a alguien fuerte...*`
        ];
        let reaccionesFemenino = [
            `*${randomCharacter.name} se sonroja y espera que la reclames...*`,
            `*${randomCharacter.name} te mira con dulzura, esperando ser tuya...*`,
            `*${randomCharacter.name} sonríe tímidamente, esperando un dueño...*`
        ];
        let reaccionesNeutro = [
            `*${randomCharacter.name} aguarda en silencio, esperando a alguien especial...*`,
            `*${randomCharacter.name} parece curioso, observando quién lo reclamará...*`,
            `*${randomCharacter.name} flota en el espacio, esperando a su próximo dueño...*`
        ];

        let reaccion;
        if (genero.includes("hombre") || genero.includes("masculino")) {
            reaccion = reaccionesMasculino[Math.floor(Math.random() * reaccionesMasculino.length)];
        } else if (genero.includes("mujer") || genero.includes("femenino")) {
            reaccion = reaccionesFemenino[Math.floor(Math.random() * reaccionesFemenino.length)];
        } else {
            reaccion = reaccionesNeutro[Math.floor(Math.random() * reaccionesNeutro.length)];
        }

        let mensajeFinal = `🎭 *¡Nuevo personaje descubierto!* 🎭\n\n` +
                           `✨ *ᥒ᥆mᑲrᥱ:* ${randomCharacter.name}\n` +
                           `📜 *𝖿ᥙᥱᥒ𝗍ᥱ:* ${randomCharacter.source}\n` +
                           `🗝 *ᥱs𝗍ᥲძ᥆:* ${statusMessage}\n\n` +
                           `${reaccion}\n` +
                           `> 𝐈𝐃: ${randomCharacter.id}\n`;

        await new Promise(resolve => setTimeout(resolve, 1500));
        await conn.sendFile(m.chat, randomImage, `${randomCharacter.name}.${ext}`, mensajeFinal, m);

        setCooldown(userId, "rollwaifu", cooldownTime);

    } catch (error) {
        await conn.reply(m.chat, `❌ Error al cargar el personaje: ${error.message}`, m);
    }
};

handler.help = ['rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['rw', 'rollwaifu'];
handler.group = true;
handler.register = true;

export default handler;
