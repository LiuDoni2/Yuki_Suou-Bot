import { delay } from "@whiskeysockets/baileys";

const handler = async (m, { args, conn }) => {
  if (!args[0] || isNaN(args[0]) || parseInt(args[0]) <= 0) {
    return conn.reply(m.chat, `⚠️ Ingresa la cantidad que deseas apostar.\n\n> _Ejemplo: *!slot 500*_`, m);
  }

  const apuesta = parseInt(args[0]);
  const users = global.db.data.users[m.sender];
  const tiempoEspera = 10000;

  if (new Date() - users.lastslot < tiempoEspera) {
    return conn.reply(m.chat, `⌛ Espera ${msToTime(tiempoEspera - (new Date() - users.lastslot))} antes de jugar de nuevo.`, m);
  }

  if (apuesta < 100) return conn.reply(m.chat, `⚠️ La apuesta mínima es de *100* ${moneda}.`, m);

 const limiteApuesta = users.coin < 5000 ? 5000 : 100000;
if (apuesta > limiteApuesta) {
  return conn.reply(m.chat, `⚠️ Tu límite de apuesta es de *${limiteApuesta}* ${moneda}.`, m);
}

  if (users.coin < apuesta) return conn.reply(m.chat, `❌ No tienes suficientes ${moneda}.`, m);

  const emojis = ['🍒', '🍋', '🍊', '🍇', '🍉', '💎', '🔔', '7️⃣'];
  const premioRaro = '💎';
  const getRandomEmojis = () => Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]);

  const renderSlots = (rows) => `
🎰 *SLOTS* 🎰
╔═════════╗
║ ${rows[0][0]} | ${rows[0][1]} | ${rows[0][2]} ║
║ ${rows[1][0]} | ${rows[1][1]} | ${rows[1][2]} ◀️
║ ${rows[2][0]} | ${rows[2][1]} | ${rows[2][2]} ║
╚═════════╝`;

  let { key } = await conn.sendMessage(m.chat, { text: `🎰 *_sᥣ᥆𝗍s gіrᥲᥒძ᥆..._*` }, { quoted: m });

  for (let i = 0; i < 5; i++) {
    await delay(300);
    await conn.sendMessage(m.chat, { text: renderSlots([getRandomEmojis(), getRandomEmojis(), getRandomEmojis()]), edit: key }, { quoted: m });
  }

  const resultadoFinal = [getRandomEmojis(), getRandomEmojis(), getRandomEmojis()];
  let mensajeFinal;
  let premio = Math.floor(apuesta * 1.4);
  let jackpot = Math.random() < 0.05;

  if (resultadoFinal[1][0] === resultadoFinal[1][1] && resultadoFinal[1][1] === resultadoFinal[1][2]) {
    if (jackpot && resultadoFinal[1][0] === premioRaro) {
      premio = Math.floor(apuesta * 4);
      mensajeFinal = `💎 *¡JACKPOT! GANASTE +${premio} ${moneda}!*`;
    } else {
      mensajeFinal = `🎉 *¡Ganaste! +${premio} ${moneda}!*`;
    }

    users.coin += premio;
    users.victorias = (users.victorias || 0) + 1;
  } else {
    mensajeFinal = `😢 *Perdiste -${apuesta} ${moneda}.*`;
    users.coin = Math.max(0, users.coin - apuesta);
    users.derrotas = (users.derrotas || 0) + 1;
  }

  users.jugadas = (users.jugadas || 0) + 1;
  users.lastslot = Date.now();

  if (Math.random() < 0.05) {
    const bonus = Math.floor(apuesta * 0.3);
    users.coin += bonus;
    mensajeFinal += `\n🎁 *¡Sorpresa! Has ganado un bono de ${bonus} ${moneda}!*`;
  }

  await conn.sendMessage(m.chat, { text: `${renderSlots(resultadoFinal)}\n\n${mensajeFinal}\n\n> _*sᥲᥣძ᥆ ᥲᥴ𝗍ᥙᥲᥣ:* ${users.coin} ${moneda}_`, edit: key }, { quoted: m });
};

handler.help = ['slot <apuesta>'];
handler.tags = ['game'];
handler.group = true;
handler.command = ['slot'];
handler.register = true;

export default handler;

function msToTime(duration) {
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  return `${minutes}m ${seconds}s`;
}
