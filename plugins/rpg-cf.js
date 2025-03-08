const users = {};

const handler = async (m, { conn, text, usedPrefix, command }) => {
    let [eleccion, cantidad] = text.split(' ');

    if (!eleccion || !cantidad) {
        return m.reply(`🪙 Usa: *${usedPrefix + command} cara 50* para apostar.`);
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
    
    if (user.coin < cantidad) {
        return m.reply(`💰 No tienes suficientes monedas. Tienes ${user.coin} ${moneda}.`);
    }

    const animacion = [
        "🪙🔄 La moneda está girando... 🔄🪙",
        "🪙🔄 Sigue girando... 🔄🪙",
        "🪙🔄 Casi cae... 🔄🪙"
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
        const ganancia = Math.floor(cantidad * 1.2); 
        user.coin += ganancia;
        mensaje = `🎉 *¡${resultado.toUpperCase()}! Ganaste +${ganancia} ${moneda}* 💰💥`;
    } else {
        user.coin -= cantidad;
        mensaje = `💀 *¡${resultado.toUpperCase()}! Perdiste ${cantidad} ${moneda}* 😢`;
    }

    await conn.sendMessage(m.chat, { text: mensaje, edit: key });
};

handler.help = ['cf'];
handler.tags = ['economy'];
handler.command = ['cf', 'suerte', 'caracruz'];
handler.group = true;
handler.register = true;

export default handler;
