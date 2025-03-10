const cooldowns = {};
const TIEMPO_ESPERA = 10 * 1000; 

const handler = async (m, { conn, text, command, usedPrefix }) => {
  const user = global.db.data.users[m.sender];

  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < TIEMPO_ESPERA) {
    let tiempoRestante = Math.ceil((cooldowns[m.sender] + TIEMPO_ESPERA - Date.now()) / 1000);
    return conn.reply(m.chat, `⏳ Ya hiciste una apuesta recientemente. Espera *${tiempoRestante} segundos* antes de apostar de nuevo.`, m);
  }

  cooldowns[m.sender] = Date.now();

  if (!text) return conn.reply(m.chat, `🎰 Usa el comando así: *${usedPrefix + command} 50 red* o *${usedPrefix + command} 100 black*`, m);

  let args = text.trim().split(" ");
  if (args.length !== 2) return conn.reply(m.chat, `⚠️ Formato incorrecto. Usa *${usedPrefix + command} <cantidad> <color>*\nEjemplo: *${usedPrefix + command} 50 red*`, m);

  let coin = parseInt(args[0]);
  let color = args[1].toLowerCase();

  if (isNaN(coin) || coin <= 0) return conn.reply(m.chat, `⚠️ Ingresa una cantidad válida para la apuesta.`, m);
  if (!(color === 'black' || color === 'red')) return conn.reply(m.chat, `⚠️ Elige un color válido: *red* 🔴 o *black* ⚫`, m);

  // 💰 Límite de apuesta según riqueza del jugador
  const limiteApuesta = user.coin < 5000 ? 5000 : 100000;
  if (coin > limiteApuesta) {
    return conn.reply(m.chat, `⚠️ No puedes apostar más de *${limiteApuesta}* ${moneda}.`, m);
  }

  if (coin > user.coin) {
    return conn.reply(m.chat, `❌ No tienes suficientes ${moneda}.\n> _sᥲᥣძ᥆: *${user.coin}* ${moneda}_`, m);
  }

  const animacion = [
    "🎰 _ᥣᥲ rᥙᥣᥱ𝗍ᥲ ᥱs𝗍á gіrᥲᥒძ᥆..._ 🔄🔴⚫",
    "🎡 _gіrᥲᥒძ᥆ más rá⍴іძ᥆..._ 🚀🔴⚫",
    "🎡 _ᥴᥲsі ᥴᥲᥱ..._ 🎯"
  ];

  let { key } = await conn.sendMessage(m.chat, { text: animacion[0] }, { quoted: m });

  for (let i = 1; i < animacion.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    await conn.sendMessage(m.chat, { text: animacion[i], edit: key });
  }

  let resultado = Math.random() < 0.5 ? 'black' : 'red';
  await new Promise(resolve => setTimeout(resolve, 2000));

  let mensaje;
  if (resultado === color) {
    let ganancia = coin * 2;
    user.coin += ganancia;
    mensaje = `🎉 ¡La bola cayó en *${resultado.toUpperCase()}*! Ganaste *${ganancia} ${moneda}*. 💥\n> _*sᥲᥣძ᥆ ᥲᥴ𝗍ᥙᥲᥣ:* ${user.coin} ${moneda}_`;
  } else {
    user.coin -= coin;
    mensaje = `❌ La bola cayó en *${resultado.toUpperCase()}*. Perdiste *${coin} ${moneda}*. 😞\n> _*sᥲᥣძ᥆ ᥲᥴ𝗍ᥙᥲᥣ:* ${user.coin} ${moneda}_`;
  }

  await conn.sendMessage(m.chat, { text: mensaje, edit: key });
};

handler.tags = ['economy'];
handler.help = ['ruleta <cantidad> <color>'];
handler.command = ['ruleta', 'roulette', 'rt'];
handler.register = true;
handler.group = true;

export default handler;
