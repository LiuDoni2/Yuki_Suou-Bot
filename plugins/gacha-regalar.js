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
    return await conn.reply(m.chat, '🔹 Debes especificar el nombre del personaje o usar "all" para transferir todos y mencionar a quien quieras regalarlos.\n> Ejemplo: *#regalar all @usuario*', m);
  }

  const mentionedUserArg = args[args.length - 1];
  if (!mentionedUserArg.startsWith('@')) {
    return await conn.reply(m.chat, '❌ Debes mencionar a un usuario válido.', m);
  }
  let mentionedUser = m.mentionedJid?.[0] || mentionedUserArg.replace('@', '') + "@s.whatsapp.net";

  if (mentionedUser === userId) {
    return await conn.reply(m.chat, '⚠️ No puedes regalarte personajes a ti mismo.', m);
  }

  try {
    const characters = await loadJSON(charactersFilePath, []);
    const harem = await loadJSON(haremFilePath, []);

    const characterName = args.slice(0, -1).join(' ').toLowerCase().trim();
    if (characterName === 'all') {

      const senderCharacters = characters.filter(c => c.user === userId);
      if (senderCharacters.length === 0) {
        return await conn.reply(m.chat, '⚠️ No tienes personajes para transferir.', m);
      }

      let transferred = [];
      let rejected = [];

      let animMsg = `_💭 Iniciando la transferencia de ${senderCharacters.length} personaje(s)..._`;
      let { key } = await conn.sendMessage(m.chat, { text: animMsg }, { quoted: m });

      for (const character of senderCharacters) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        let seQueda = Math.random() < 0.05;
        if (seQueda) {
          rejected.push(character.name);
        } else {
          const existingEntry = harem.find(entry => entry.characterId === character.id);
          if (existingEntry) {
            existingEntry.userId = mentionedUser;
            existingEntry.lastClaimTime = Date.now();
          } else {
            harem.push({ userId: mentionedUser, characterId: character.id, lastClaimTime: Date.now() });
          }
          character.user = mentionedUser;
          transferred.push(character.name);
        }
      }

      await saveJSON(charactersFilePath, characters);
      await saveJSON(haremFilePath, harem);

      let mensajeFinal = `🎁 *¡Transferencia completada!* 🎁\n\n`;
      if (transferred.length > 0) {
        mensajeFinal += `✨ Personajes transferidos a @${mentionedUser.split('@')[0]}:\n- ${transferred.join('\n- ')}\n\n`;
      }
      if (rejected.length > 0) {
        mensajeFinal += `⚠️ Personajes que se quedaron con su dueño:\n- ${rejected.join('\n- ')}\n\n`;
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
      await conn.sendMessage(m.chat, { text: mensajeFinal, edit: key, mentions: [mentionedUser] });
      return;
    }

    const character = characters.find(c => c.name.toLowerCase() === characterName && c.user === userId);
    if (!character) {
      return await conn.reply(m.chat, `⚠️ No puedes regalar *${characterName}* porque no te pertenece.`, m);
    }

    let seQueda = Math.random() < 0.05;
    if (seQueda) {
      let frasesRechazo = [
        `*${character.name} sacude la cabeza y dice: "Lo siento... No quiero irme."*`,
        `*${character.name} se aferra a su dueño y se niega a marcharse.*`,
        `*${character.name} dice con lágrimas en los ojos: "¡No quiero un nuevo dueño!"*`
      ];
      return await conn.reply(m.chat, frasesRechazo[Math.floor(Math.random() * frasesRechazo.length)], m);
    }

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

handler.help = ['regalar <nombre del personaje> @usuario', 'regalar all @usuario'];
handler.tags = ['gacha'];
handler.command = ['regalar', 'givewaifu', 'givechar'];
handler.group = true;
handler.register = true;

export default handler;
