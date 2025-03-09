const riskLevels = [
  { nivel: 1, multiplicador: 1.2, probabilidad: 100 }, // Seguro
  { nivel: 2, multiplicador: 1.5, probabilidad: 50 },  // 50% de éxito
  { nivel: 3, multiplicador: 2.0, probabilidad: 30 },  // 30% de éxito
  { nivel: 4, multiplicador: 3.0, probabilidad: 10 },  // 10% de éxito
];

const gameSessions = {}; // Almacena partidas activas
const TIEMPO_ESPERA = 10 * 1000; // 10 segundos antes de jugar de nuevo

const handler = async (m, { args, conn }) => {
  const user = global.db.data.users[m.sender];
  const chatId = m.chat;

  if (!args[0]) {
    return conn.reply(m.chat, `⚠️ Usa: *torre <apuesta>*\nEjemplo: *torre 500*`, m);
  }

  const apuesta = parseInt(args[0]);
  if (isNaN(apuesta) || apuesta <= 0) {
    return conn.reply(m.chat, `⚠️ La apuesta debe ser un número válido mayor a 0.`, m);
  }

  // 💰 Límite de apuesta según riqueza del jugador
  const limiteApuesta = user.coin < 5000 ? 500 : 1000;
  if (apuesta > limiteApuesta) {
    return conn.reply(m.chat, `⚠️ No puedes apostar más de *${limiteApuesta}* ${moneda}.`, m);
  }

  if (user.coin < apuesta) {
    return conn.reply(m.chat, `❌ No tienes suficientes ${moneda}.\n\n> Saldo: *${user.coin}* ${moneda}`, m);
  }

  if (gameSessions[chatId]) {
    return conn.reply(m.chat, `⚠️ Ya hay una partida en curso.\n\n> Usa *detener* o *subir*.`, m);
  }

  user.coin -= apuesta;
  gameSessions[chatId] = {
    jugador: m.sender,
    apuesta,
    nivel: 1,
    ganancia: apuesta * riskLevels[0].multiplicador,
    ultimaJugada: Date.now(),
  };

  conn.reply(m.chat, `🏰🔥 *Torre del Destino* 🔥🏰\n\n🔹 Iniciaste la partida con una apuesta de *${apuesta}* ${moneda}.\n🔹 Has subido al *Nivel 1* y ahora tienes *${gameSessions[chatId].ganancia.toFixed(2)}* ${moneda}.\n\n> 🔼 Escribe *subir* para seguir arriesgando.\n> 🛑 Escribe *detener* para cobrar tu ganancia.`, m);
};

handler.before = async function (m, { conn }) {
  const chatId = m.chat;
  if (!gameSessions[chatId] || gameSessions[chatId].jugador !== m.sender) return;

  const game = gameSessions[chatId];

  if (Date.now() - game.ultimaJugada < TIEMPO_ESPERA) {
    let tiempoRestante = Math.ceil((TIEMPO_ESPERA - (Date.now() - game.ultimaJugada)) / 1000);
    return conn.reply(m.chat, `⏳ Espera *${tiempoRestante} segundos* antes de hacer tu próxima jugada.`, m);
  }

  game.ultimaJugada = Date.now(); // Actualiza el tiempo de espera

  if (m.text.toLowerCase() === "detener") {
    global.db.data.users[m.sender].coin += game.ganancia;
    delete gameSessions[chatId];
    return conn.reply(m.chat, `🏆 ¡Has cobrado *${game.ganancia.toFixed(2)}* ${moneda}! 🎉\n\n> 💰 *Saldo actual:* ${global.db.data.users[m.sender].coin} ${moneda}`, m);
  }

  if (m.text.toLowerCase() === "subir") {
    if (game.nivel >= riskLevels.length) {
      return conn.reply(m.chat, `⚠️ Ya has alcanzado el nivel máximo.`, m);
    }

    const nextLevel = riskLevels[game.nivel];
    const random = Math.random() * 100;

    if (random <= nextLevel.probabilidad) {
      game.nivel++;
      game.ganancia = game.apuesta * nextLevel.multiplicador;

      return conn.reply(m.chat, `🏰🔥 *Torre del Destino* 🔥🏰\n\n✔️ Has subido al *Nivel ${game.nivel}* y ahora tienes *${game.ganancia.toFixed(2)}* ${moneda}.\n\n> 🔼 Escribe *subir* para seguir arriesgando.\n> 🛑 Escribe *detener* para cobrar tu ganancia.`, m);
    } else {
      delete gameSessions[chatId];
      return conn.reply(m.chat, `❌ Fallaste y perdiste todo. 😱\n💸 La torre te ha vencido.`, m);
    }
  }
};

handler.command = ["torre"];
export default handler;
