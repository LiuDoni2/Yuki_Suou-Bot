import { delay } from "@whiskeysockets/baileys";

const carreras = {};

const handler = async (m, { args, conn }) => {
  const chatId = m.chat;

  if (!args[0] || !args[1] || isNaN(args[1]) || parseInt(args[1]) <= 0) {
    return conn.reply(
      m.chat,
      "🌟 *¡Carrera de autos!* 🌟\n\n" +
        "🚦 Usa: *!carrera <emoji> <apuesta>*\n" +
        "> Ejemplo: *!carrera 🚗 500*\n" +
        "> _Vehículos: 🚗 🚕 🚙 🛻_",
      m
    );
  }

  const emojiSeleccionado = args[0];
  const apuesta = parseInt(args[1]);
  const users = global.db.data.users[m.sender] || { coin: 0 };

  if (users.coin < apuesta) {
    return conn.reply(
      m.chat,
      `❌ No tienes suficientes monedas. 💰 Saldo: ${users.coin}`,
      m
    );
  }

  const emojisApuesta = ["🚗", "🚕", "🚙", "🛻"];
  if (!emojisApuesta.includes(emojiSeleccionado)) {
    return conn.reply(
      m.chat,
      `⚠️ *Emoji inválido.*\n🔹 Usa uno de estos: ${emojisApuesta.join(" ")}`,
      m
    );
  }

  if (!carreras[chatId]) {
    carreras[chatId] = { jugadores: {}, enCurso: false };
    conn.reply(
      m.chat,
      "🏁 *¡Nueva Carrera Iniciada!* 🏁\n\n" +
        "🚦 Tienes *15 segundos* para unirte.\n" +
        "🎮 Usa *!carrera <emoji> <apuesta>* para participar.\n" +
        "🏆 ¡El ganador triplica su apuesta! 🚀",
      m
    );

    setTimeout(() => iniciarCarrera(chatId, conn, m), 15000);
  }

  users.coin -= apuesta;
  carreras[chatId].jugadores[m.sender] = { emoji: emojiSeleccionado, apuesta };
  conn.reply(
    m.chat,
    `✅ *@${m.sender.split("@")[0]}* apostó *${apuesta}* monedas por ${emojiSeleccionado}.`,
    m,
    { mentions: [m.sender] }
  );
};

async function iniciarCarrera(chatId, conn, m) {
  if (!carreras[chatId] || Object.keys(carreras[chatId].jugadores).length === 0) {
    delete carreras[chatId];
    return conn.reply(
      m.chat,
      "⚠️ No hubo suficientes jugadores. 🚗💨 *Carrera cancelada.*",
      m
    );
  }

  carreras[chatId].enCurso = true;
  let posiciones = { "🚗": 0, "🚕": 0, "🚙": 0, "🛻": 0 };
  const meta = 12;
  let ganador = null;

  const renderCarrera = () => {
    return `
★ ° . *　　　°　.　°☆ 　. * ● ¸
. 　　　★ 　🌕° :. ★　 * • ○ ° ★
     ▂▂▂▂▂▂▂▂▂▂▂▂▂▂
${carril("🚗")}
     ▂▂▂▂▂▂▂▂▂▂▂▂▂▂
${carril("🚕")}
     ▂▂▂▂▂▂▂▂▂▂▂▂▂▂
${carril("🚙")}
     ▂▂▂▂▂▂▂▂▂▂▂▂▂▂
${carril("🛻")}
     ▂▂▂▂▂▂▂▂▂▂▂▂▂▂
    `;
  };

  const carril = (emoji) => {
    let metaIcono = posiciones[emoji] >= meta ? "🏆" : "🏁";
    let espacio = "_ ".repeat(meta - posiciones[emoji]);
    return `${metaIcono}${espacio}${emoji}💨`;
  };

  let { key } = await conn.sendMessage(
    m.chat,
    { text: `🚦 *¡La carrera comienza!* 🚗💨\n\n${renderCarrera()}` },
    { quoted: m }
  );

  while (!ganador) {
    await delay(3000);
    Object.keys(posiciones).forEach((e) => {
      if (!ganador) {
        posiciones[e] = Math.min(meta, posiciones[e] + Math.floor(Math.random() * 3) + 1);
        if (posiciones[e] >= meta) ganador = e;
      }
    });

    await conn.sendMessage(
      m.chat,
      { text: `🚦 *Carrera en progreso...* 🌪️\n\n${renderCarrera()}`, edit: key },
      { quoted: m }
    );
  }

  let mensajeFinal = `🎉 *¡Ganó ${ganador}!* 🏆\n`;
  let ganadoresUsuarios = [];

  Object.entries(carreras[chatId].jugadores).forEach(([id, data]) => {
    if (data.emoji === ganador) {
      global.db.data.users[id] = global.db.data.users[id] || { coin: 0 };
      global.db.data.users[id].coin += data.apuesta * 3;
      ganadoresUsuarios.push(id);
      mensajeFinal += `💰 *@${id.split("@")[0]}* ganó *${data.apuesta * 3}* monedas.\n`;
    }
  });

  if (ganadoresUsuarios.length === 0) {
    mensajeFinal += `😢 Nadie apostó por el ganador. Todos pierden sus apuestas.`;
  }

  await conn.sendMessage(
    m.chat,
    { text: `🚦 *¡Carrera finalizada!* 🏁\n\n${renderCarrera()}\n\n${mensajeFinal}` },
    { quoted: m, mentions: ganadoresUsuarios }
  );

  delete carreras[chatId];
}

handler.help = ["carrera <emoji> <apuesta>"];
handler.tags = ["game"];
handler.group = true;
handler.command = ["carrera"];
handler.register = true;

export default handler;
