import { promises as fs } from 'fs';

const charactersFilePath = './src/database/characters.json';
const haremFilePath = './src/database/harem.json';

const cooldowns = {};

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('❀ No se pudo cargar el archivo characters.json.');
  }
}

async function saveCharacters(characters) {
  try {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
  } catch (error) {
    throw new Error('❀ No se pudo guardar el archivo characters.json.');
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

async function saveHarem(harem) {
  try {
    await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2), 'utf-8');
  } catch (error) {
    throw new Error('❀ No se pudo guardar el archivo harem.json.');
  }
}

let handler = async (m, { conn }) => {
  const userId = m.sender;
  const now = Date.now();

  if (cooldowns[userId] && now < cooldowns[userId]) {
    const remainingTime = Math.ceil((cooldowns[userId] - now) / 1000);
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return await conn.reply(
      m.chat,
      `《✧》Debes esperar *${minutes} minutos y ${seconds} segundos* para usar *#rw* de nuevo.`,
      m
    );
  }

  try {
    const characters = await loadCharacters();
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];

    if (!randomCharacter.img || !Array.isArray(randomCharacter.img) || randomCharacter.img.length === 0) {
      throw new Error("El personaje no tiene imágenes definidas.");
    }
    const randomImage = randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)];

    let ext = 'jpg';
    const matches = randomImage.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
    if (matches) {
      ext = matches[1].toLowerCase();
    }
    const fileName = `${randomCharacter.name}.${ext}`;

    const harem = await loadHarem();
    let userEntry = harem.find(entry => entry.characterId === randomCharacter.id);

    let statusMessage = 'Libre';
    if (randomCharacter.user) {
      const claimedName = await conn.getName(randomCharacter.user);
      statusMessage = `Reclamado por @${claimedName}`;
    }

    const message = `❀ Nombre » *${randomCharacter.name}*
⚥ Género » *${randomCharacter.gender}*
✰ Valor » *${randomCharacter.value}*
♡ Estado » ${statusMessage}
❖ Fuente » *${randomCharacter.source}*
ID: *${randomCharacter.id}*`;

    const mentions = userEntry ? [userEntry.userId] : [];
    await conn.sendFile(m.chat, randomImage, fileName, message, m, { mentions });

    if (!userEntry && randomCharacter.user) {
      userEntry = {
        userId: randomCharacter.user,
        characterId: randomCharacter.id,
        lastVoteTime: now,
        voteCooldown: now + 1.5 * 60 * 60 * 1000
      };
      harem.push(userEntry);
      await saveHarem(harem);
    }

    await saveCharacters(characters);
    cooldowns[userId] = now + 20 * 60 * 1000;
  } catch (error) {
    await conn.reply(m.chat, `✘ Error al cargar el personaje: ${error.message}`, m);
  }
};

handler.help = ['ver', 'rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['ver', 'rw', 'rollwaifu'];
handler.group = true;
handler.register = true;

export default handler;
