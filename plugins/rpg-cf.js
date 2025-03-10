const cooldowns = {};
const TIEMPO_ESPERA = 10 * 1000; 

const handler = async (m, { conn, text, usedPrefix, command }) => {
    let [eleccion, cantidad] = text.split(' ');

    if (!eleccion || !cantidad) {
        return m.reply(` 🪙 Usa: *${usedPrefix + command} cara 50* para apostar.`);
    }

    eleccion = eleccion.toLowerCase();
    cantidad = parseInt(cantidad);
    
    if (!['cara', 'cruz'].includes(eleccion)) {
        return m.reply(`⚠️ Solo puedes elegir *cara* o *cruz*.\nEjemplo: *${usedPrefix + command} cara 50*`);
    }
    
    if (isNaN(cantidad) || cantidad <= 0) {
        return m.reply(`⚠️ Ingresa una cantidad válida para apostar.`);
    }

    const user = global.db.data.users[m.sender];

    const limiteApuesta = user.coin < 5000 ? 5000 : 100000;
    if (cantidad > limiteApuesta) {
        return m.reply(`⚠️ No puedes apostar más de *${limiteApuesta}* ${moneda}.`);
    }

    if (user.coin < cantidad) {
        return m.reply(`💰 No tienes suficientes ${moneda}.\n> _Tienes ${user.coin} ${moneda}._`);
    }

    if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < TIEMPO_ESPERA) {
        let tiempoRestante = Math.ceil((cooldowns[m.sender] + TIEMPO_ESPERA - Date.now()) / 1000);
        return m.reply(`⏳ Espera *${tiempoRestante} segundos* antes de jugar de nuevo.`);
    }

    cooldowns[m.sender] = Date.now();

    const animacion = [
        "🪙🔄 _ᥣᥲ m᥆ᥒᥱძᥲ ᥱs𝗍á gіrᥲᥒძ᥆..._ 🔄🪙",
        "🪙🔄 _sіgᥙᥱ gіrᥲᥒძ᥆..._ 🔄🪙",
        "🪙🔄 _ᥴᥲsі ᥴᥲᥱ..._ 🔄🪙"
    ];

    let { key } = await conn.sendMessage(m.chat, { text: animacion[0] }, { quoted: m });

    for (let i = 1; i < animacion.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await conn.sendMessage(m.chat, { text: animacion[i], edit: key });
    }

    const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
    await new Promise(resolve => setTimeout(resolve, 1000));

    let mensaje;
    if (resultado === eleccion) {
        const ganancia = Math.floor(cantidad * 1.5); 
        user.coin += ganancia;
        mensaje = `🎉 *¡${resultado.toUpperCase()}! Ganaste +${ganancia} ${moneda}* 💰💥\n> _*sᥲᥣძ᥆ ᥲᥴ𝗍ᥙᥲᥣ:* ${user.coin} ${moneda}_`;
    } else {
        user.coin -= cantidad;
        mensaje = `💀 *¡${resultado.toUpperCase()}! Perdiste ${cantidad} ${moneda}* 😢\n> _*sᥲᥣძ᥆ ᥲᥴ𝗍ᥙᥲᥣ:* ${user.coin} ${moneda}_`;
    }

    await conn.sendMessage(m.chat, { text: mensaje, edit: key });
};

handler.help = ['cf'];
handler.tags = ['economy'];
handler.command = ['cf', 'suerte', 'caracruz'];
handler.group = true;
handler.register = true;

export default handler;
