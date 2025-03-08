import { delay } from "@whiskeysockets/baileys";

const duelos = {};

const handler = async (m, { args, conn }) => {
  const chatId = m.chat;

  if (!args[0] || isNaN(args[0]) || parseInt(args[0]) <= 0) {
    return conn.reply(m.chat, '⚠️ Usa: *!duelo <apuesta>*\nEjemplo: *!duelo 500*', m);
  }

  const apuesta = parseInt(args[0]);
  const users = global.db.data.users[m.sender];

  if (users.coin < apuesta) {
    return conn.reply(m.chat, `❌ No tienes suficientes ${moneda}.\n\nSaldo: ${users.coin}`, m);
  }

  if (duelos[chatId]) {
    if (duelos[chatId].jugadores.includes(m.sender)) {
      return conn.reply(m.chat, '⚠️ Ya estás en este duelo.', m);
    }

    duelos[chatId].jugadores.push(m.sender);
    users.coin -= apuesta;
    duelos[chatId].apuestas[m.sender] = apuesta;

    if (duelos[chatId].jugadores.length === 2) {
      iniciarDuelo(chatId, conn, m);
    } else {
      conn.reply(m.chat, `🤠 @${m.sender.split('@')[0]} ha aceptado el duelo.\nEsperando otro jugador...`, m, { mentions: [m.sender] });
    }
  } else {
    duelos[chatId] = {
      jugadores: [m.sender],
      apuestas: { [m.sender]: apuesta },
      disparo: null,
      esperandoDisparo: false
    };

    users.coin -= apuesta;
    conn.reply(m.chat, `🤠 @${m.sender.split('@')[0]} ha iniciado un duelo con una apuesta de *${apuesta}* ${moneda}\n\nUsa *!duelo ${apuesta}* para aceptar el reto.`, m, { mentions: [m.sender] });

    setTimeout(() => {
      if (duelos[chatId] && duelos[chatId].jugadores.length < 2) {
        users.coin += apuesta;
        delete duelos[chatId];
        conn.reply(m.chat, '⏳ Nadie aceptó el duelo. Apuesta devuelta.', m);
      }
    }, 30000); 
  }
};

async function iniciarDuelo(chatId, conn, m) {
  if (!duelos[chatId] || duelos[chatId].jugadores.length < 2) return;

  const [jugador1, jugador2] = duelos[chatId].jugadores;
  const apuestaTotal = duelos[chatId].apuestas[jugador1] + duelos[chatId].apuestas[jugador2];

  conn.reply(m.chat, `🎯 ¡El duelo ha comenzado!\n🤠 ${jugador1.split('@')[0]} vs 🤠 ${jugador2.split('@')[0]}\n\n⚠️ Esperen la señal "¡DISPARA! 🔫"\nQuien dispare antes del aviso, pierde automáticamente.`, m, { mentions: [jugador1, jugador2] });

  let tiempoEspera = Math.floor(Math.random() * 10000) + 5000; 
  setTimeout(async () => {
    if (!duelos[chatId]) return;

    duelos[chatId].esperandoDisparo = true;
    await conn.sendMessage(m.chat, { text: '🔥 ¡DISPARA! 🔫' }, { quoted: m });

    setTimeout(() => {
      if (duelos[chatId] && !duelos[chatId].disparo) {
        global.db.data.users[jugador1].coin += duelos[chatId].apuestas[jugador1];
        global.db.data.users[jugador2].coin += duelos[chatId].apuestas[jugador2];
        conn.reply(m.chat, '⌛ Nadie disparó a tiempo. Apuestas devueltas.', m);
        delete duelos[chatId];
      }
    }, 5000); 

  }, tiempoEspera);
}

handler.before = async function (m) {
  const chatId = m.chat;

  if (duelos[chatId] && duelos[chatId].jugadores.includes(m.sender)) {
    const duelo = duelos[chatId];

    if (!duelo.esperandoDisparo && m.text.toLowerCase() === 'bang') {
      delete duelos[chatId];
      return this.reply(m.chat, `❌ @${m.sender.split('@')[0]} disparó *antes de tiempo* y perdió automáticamente.`, m, { mentions: [m.sender] });
    }

    if (duelo.esperandoDisparo && m.text.toLowerCase() === 'bang') {
      if (!duelo.disparo) {
        duelo.disparo = m.sender;
        global.db.data.users[m.sender].coin += duelo.apuestas[duelo.jugadores[0]] + duelo.apuestas[duelo.jugadores[1]];
        delete duelos[chatId];
        return this.reply(m.chat, `🎯 @${m.sender.split('@')[0]} disparó primero y ganó *${duelo.apuestas[duelo.jugadores[0]] + duelo.apuestas[duelo.jugadores[1]]}* ${moneda} 💸`, m, { mentions: [m.sender] });
      }
    }
  }
};

handler.help = ['duelo <apuesta>'];
handler.tags = ['game'];
handler.group = true;
handler.command = ['duelo'];
handler.register = true;

export default handler;
