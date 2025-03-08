//by: 劉ī.am/𝕷𝖎̈́𝖚̈́⋆𝕯̈́𝖔̈́𝖓̈́𝖎̈́፨ᵒᶠᶜ劉
const handler = async (m, { conn, participants, args }) => {
  if (!m.isGroup) return conn.reply(m.chat, '⚠️ Este juego solo funciona en grupos.', m);

  global.db.data.impostor = global.db.data.impostor || {};
  const users = global.db.data.users;
  const group = m.chat;

  if (!args[0]) {
    if (global.db.data.impostor[group]) {
      return conn.reply(m.chat, '⚠️ Ya hay un juego en curso. Usa *!impostor reveal* para ver quién era.', m);
    }

    const players = participants.map(p => p.id).filter(id => id !== conn.user.jid);
    if (players.length < 3) {
      return conn.reply(m.chat, '⚠️ Se necesitan al menos 3 jugadores.', m);
    }

    const impostor = players[Math.floor(Math.random() * players.length)];
    global.db.data.impostor[group] = { impostor, accused: [], players, hints: 0, reward: 5000 };

    for (const player of players) {
      users[player] = users[player] || { coin: 0 };
      users[player].coin += 100;
    }

    return conn.reply(m.chat, `🔍 ¡Un impostor está entre nosotros! 
🔎 Acusen con *!impostor @usuario* para atraparlo.
💰 Recompensa inicial: *5000 ${moneda}*`, m);
  }

  if (args[0] === 'reveal') {
    if (!global.db.data.impostor[group]) return conn.reply(m.chat, '⚠️ No hay un juego en curso.', m);
    const { impostor } = global.db.data.impostor[group];
    delete global.db.data.impostor[group];

    return conn.reply(m.chat, `🎭 El impostor era @${impostor.split('@')[0]}. 
💰 Como se reveló, la recompensa final es de *2000 ${moneda}*`, m, { mentions: [impostor] });
  }

  if (args[0].startsWith('@')) {
    if (!global.db.data.impostor[group]) return conn.reply(m.chat, '⚠️ No hay un juego en curso.', m);

    const mentionedUser = args[0].replace('@', '') + '@s.whatsapp.net';
    const gameData = global.db.data.impostor[group];

    if (mentionedUser === gameData.impostor) {
      delete global.db.data.impostor[group];
      users[m.sender].coin += gameData.reward;
      return conn.reply(m.chat, `✅ ¡Correcto! @${mentionedUser.split('@')[0]} era el impostor. 🎉 
🏆 Ganaste *${gameData.reward} ${moneda}*`, m, { mentions: [mentionedUser] });
    }

    gameData.accused.push(mentionedUser);

    if (gameData.accused.length % 3 === 0 && gameData.hints < 2) {
      gameData.hints += 1;
      gameData.reward -= 1000;
      const hint = gameData.impostor.split('@')[0].slice(0, gameData.hints + 1) + '...';
      return conn.reply(m.chat, `❌ @${mentionedUser.split('@')[0]} NO es el impostor.
🔎 Pista desbloqueada: El impostor empieza con *"${hint}"*
💰 Nueva recompensa: *${gameData.reward} ${moneda}*`, m, { mentions: [mentionedUser] });
    }

    return conn.reply(m.chat, `❌ @${mentionedUser.split('@')[0]} no es el impostor. Intenta de nuevo.`, m, { mentions: [mentionedUser] });
  }

  return conn.reply(m.chat, '❓ Usa *!impostor*, *!impostor @usuario* o *!impostor reveal*.', m);
};

handler.help = ['impostor', 'impostor @usuario', 'impostor reveal'];
handler.tags = ['game'];
handler.command = ['impostor'];
handler.group = true;

export default handler;
