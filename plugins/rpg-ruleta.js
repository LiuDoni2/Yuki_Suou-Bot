let cooldowns = {};

let handler = async (m, { conn, text, command, usedPrefix }) => {
  let users = global.db.data.users[m.sender];
  let tiempoEspera = 10; 

  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera * 1000) {
    let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempoEspera * 1000 - Date.now()) / 1000));
    conn.reply(m.chat, `⏳ Ya hiciste una apuesta recientemente. Espera *${tiempoRestante}* antes de apostar de nuevo.`, m);
    return;
  }

  cooldowns[m.sender] = Date.now();

  if (!text) return conn.reply(m.chat, `🎰 Usa el comando así: *${usedPrefix + command} 50 red* o *${usedPrefix + command} 100 black*`, m);

  let args = text.trim().split(" ");
  if (args.length !== 2) return conn.reply(m.chat, `⚠️ Formato incorrecto. Usa *${usedPrefix + command} <cantidad> <color>*\nEjemplo: *${usedPrefix + command} 50 red*`, m);

  let coin = parseInt(args[0]);
  let color = args[1].toLowerCase();

  if (isNaN(coin) || coin <= 0) return conn.reply(m.chat, `⚠️ Ingresa una cantidad válida para la apuesta.`, m);
  if (!(color === 'black' || color === 'red')) return conn.reply(m.chat, `⚠️ Elige un color válido: *red* 🔴 o *black* ⚫`, m);
  if (coin > users.coin) return conn.reply(m.chat, `❌ No tienes suficientes monedas. Tu saldo: *${users.coin}*`, m);

  const animacion = [
    "🎰 La ruleta está girando... 🔄🔴⚫",
    "🎡 Girando... ⏳🔴⚫",
    "🎡 La bola está por caer... 🎯"
  ];

  let { key } = await conn.sendMessage(m.chat, { text: animacion[0] }, { quoted: m });

  for (let i = 1; i < animacion.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    await conn.sendMessage(m.chat, { text: animacion[i], edit: key });
  }

  // 🎲 Resultado aleatorio
  let resultado = Math.random() < 0.5 ? 'black' : 'red';
  await new Promise(resolve => setTimeout(resolve, 2000));

  let mensaje;
  if (resultado === color) {
    let ganancia = coin * 2; 
    users.coin += ganancia;
    mensaje = `🎉 ¡La bola cayó en *${resultado.toUpperCase()}*! ¡Ganaste *${ganancia}* ${senderName}. 💰`;
  } else {
    users.coin -= coin;
    mensaje = `❌ La bola cayó en *${resultado.toUpperCase()}*. Perdiste *${coin}* ${senderName}. 😞`;
  }

  await conn.sendMessage(m.chat, { text: mensaje, edit: key });
};

handler.tags = ['economy'];
handler.help = ['ruleta <cantidad> <color>'];
handler.command = ['ruleta', 'roulette', 'rt'];
handler.register = true;
handler.group = true;

export default handler;

function segundosAHMS(segundos) {
  let segundosRestantes = segundos % 60;
  return `${segundosRestantes} segundos`;
}
