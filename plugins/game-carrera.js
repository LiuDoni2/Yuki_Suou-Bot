// by 
import { delay } from "@whiskeysockets/baileys";

const carreras = {};

const handler = async (m, { args, conn }) => {
  const chatId = m.chat;

  if (!args[0] || !args[1] || isNaN(args[1]) || parseInt(args[1]) <= 0) {
    return conn.reply(m.chat, '⚠️ Usa: *!carrera <emoji> <apuesta>*\nEjemplo: *!carrera 🚗 500*', m);
  }

  const emojiSeleccionado = args[0];
  const apuesta = parseInt(args[1]);
  const users = global.db.data.users[m.sender];

  if (users.coin < apuesta) {
    return conn.reply(m.chat, `❌ No tienes suficientes monedas. Saldo: ${users.coin}`, m);
  }

  const emojis = ['🚗', '🚕', '🚙'];
  if (!emojis.includes(emojiSeleccionado)) {
    return conn.reply(m.chat, `⚠️ Emoji inválido. Usa: ${emojis.join(' ')}`, m);
  }

  if (!carreras[chatId]) {
    carreras[chatId] = { jugadores: {}, enCurso: false };
    conn.reply(m.chat, `🚦 ¡Carrera de ciudad iniciada!\nTienes *20 segundos* para unirte.\nUsa *!carrera <emoji> <apuesta>* para participar.`, m);
    
    setTimeout(() => iniciarCarrera(chatId, conn, m), 20000);
  }

  users.coin -= apuesta;
  carreras[chatId].jugadores[m.sender] = { emoji: emojiSeleccionado, apuesta };
  conn.reply(m.chat, `✅ @${m.sender.split('@')[0]} apostó *${apuesta}* monedas por ${emojiSeleccionado}.`, m, { mentions: [m.sender] });
};

async function iniciarCarrera(chatId, conn, m) {
  if (!carreras[chatId] || Object.keys(carreras[chatId].jugadores).length === 0) {
    delete carreras[chatId];
    return conn.reply(m.chat, "⚠️ No hubo suficientes jugadores. Carrera cancelada.", m);
  }

  carreras[chatId].enCurso = true;
  const posiciones = { '🚗': 9, '🚕': 9, '🚙': 9 };
  const meta = 0;
  let ganador = null;

  const renderCarrera = () => {
    return [
      "⛩️⬛⬛⬛⬛⬛⬛⬛⬛⬛🏘️",
      `🏁${'▫️'.repeat(Math.max(0, posiciones['🚗']))}${'🚗'}${'▫️'.repeat(9 - posiciones['🚗'])}`,
      "⛩️⬛⬛⬛⬛⬛⬛⬛⬛⬛🏘️",
      `${posiciones['🚕'] === 0 ? '🏆' : '🏁'}${'▫️'.repeat(Math.max(0, posiciones['🚕']))}${'🚕'}${'▫️'.repeat(9 - posiciones['🚕'])}`,
      "⛩️⬛⬛⬛⬛⬛⬛⬛⬛⬛🏘️",
      `🏁${'▫️'.repeat(Math.max(0, posiciones['🚙']))}${'🚙'}${'▫️'.repeat(9 - posiciones['🚙'])}`,
      "⛩️⬛⬛⬛⬛⬛⬛⬛⬛⬛🏘️"
    ].join('\n');
  };

  let { key } = await conn.sendMessage(m.chat, { text: `🚦 ¡La carrera comienza!\n\n${renderCarrera()}` }, { quoted: m });

  while (!ganador) {
    await delay(3000);
    ['🚗', '🚕', '🚙'].forEach(e => posiciones[e] = Math.max(meta, posiciones[e] - Math.floor(Math.random() * 2 + 1))); // Avance aleatorio de 1 a 2

    if (Object.values(posiciones).some(p => p <= meta)) {
      ganador = Object.keys(posiciones).find(e => posiciones[e] <= meta);
    }

    await conn.sendMessage(m.chat, { text: `🚦 Carrera en progreso...\n\n${renderCarrera()}`, edit: key }, { quoted: m });
  }

  let mensajeFinal = `🎉 ¡Ganó el ${ganador}!`;
  let ganadores = Object.entries(carreras[chatId].jugadores).filter(([id, data]) => data.emoji === ganador);

  if (ganadores.length > 0) {
    ganadores.forEach(([id, data]) => {
      global.db.data.users[id].coin += data.apuesta * 3;
      mensajeFinal += `\n💰 @${id.split('@')[0]} ganó *${data.apuesta * 3}* monedas.`;
    });
  } else {
    mensajeFinal += `\n😢 Nadie apostó por el ganador. Todos pierden sus apuestas.`;
  }

  await conn.sendMessage(m.chat, { text: `🚦 Carrera finalizada!\n\n${renderCarrera()}\n\n${mensajeFinal}` }, { quoted: m, mentions: ganadores.map(([id]) => id) });

  delete carreras[chatId];
}

handler.help = ['carrera <emoji> <apuesta>'];
handler.tags = ['game'];
handler.group = true;
handler.command = ['carrera'];
handler.register = true;

export default handler;
