const cooldowns = {};
const TIEMPO_ESPERA = 10 * 1000; 

const handler = async (m, { conn, args, usedPrefix, command }) => {
    const user = global.db.data.users[m.sender];
    const apuesta = parseInt(args[0]);

    if (!apuesta || isNaN(apuesta) || apuesta <= 0) {
        return conn.reply(m.chat, `⚠️ Ingresa una cantidad válida para apostar.\nEjemplo: *${usedPrefix + command} 100*`, m);
    }

    if (user.coin < apuesta) {
        return conn.reply(m.chat, `❌ No tienes suficientes monedas. Saldo: *${user.coin}* 💰`, m);
    }

    if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < TIEMPO_ESPERA) {
        let tiempoRestante = Math.ceil((cooldowns[m.sender] + TIEMPO_ESPERA - Date.now()) / 1000);
        return conn.reply(m.chat, `⏳ Debes esperar *${tiempoRestante} segundos* antes de jugar de nuevo.`, m);
    }

    cooldowns[m.sender] = Date.now();
    user.coin -= apuesta;

    const cajas = ["💰", "💰", "💰", "💰", "💣"];
    cajas.sort(() => Math.random() - 0.5); 

    let mensaje = `🎰 *¡Encuentra la Bomba!* 🎰\n\n`;
    mensaje += `📦 📦 📦 📦 📦\n\n`;
    mensaje += `🔹 Elige una caja (1-5) escribiendo *elegir <número>*\n`;
    mensaje += `🔹 Puedes retirarte con la mitad escribiendo *retirarse*`;

    if (!conn.bombaGame) conn.bombaGame = {};
    conn.bombaGame[m.sender] = { apuesta, cajas, abierta: false };

    return conn.reply(m.chat, mensaje, m);
};

handler.before = async function (m, { conn }) {
    if (!conn.bombaGame || !conn.bombaGame[m.sender]) return;
    let juego = conn.bombaGame[m.sender];

    if (m.text.startsWith("elegir ")) {
        if (juego.abierta) return conn.reply(m.chat, "⚠️ Ya abriste una caja. Usa *!bomba* para jugar de nuevo.", m);

        const eleccion = parseInt(m.text.split(" ")[1]);
        if (isNaN(eleccion) || eleccion < 1 || eleccion > 5) return conn.reply(m.chat, `⚠️ Debes elegir un número entre *1 y 5*.\nEjemplo: *elegir 3*`, m);

        juego.abierta = true;
        let resultado = juego.cajas[eleccion - 1];

        let cajasEstado = ["📦", "📦", "📦", "📦", "📦"];
        let key = await conn.sendMessage(m.chat, { text: cajasEstado.join(" ") }, { quoted: m });

        await delay(1000);
        cajasEstado[eleccion - 1] = "🔄";
        await conn.sendMessage(m.chat, { text: cajasEstado.join(" "), edit: key }, { quoted: m });

        await delay(1000);
        cajasEstado[eleccion - 1] = "💫";
        await conn.sendMessage(m.chat, { text: cajasEstado.join(" "), edit: key }, { quoted: m });

        await delay(1000);
        cajasEstado[eleccion - 1] = resultado;
        await conn.sendMessage(m.chat, { text: cajasEstado.join(" "), edit: key }, { quoted: m });

        delete conn.bombaGame[m.sender]; 

        if (resultado === "💣") {
            return conn.reply(m.chat, `💥 *¡BOOM! Perdiste* ${juego.apuesta} 💰`, m);
        } else {
            global.db.data.users[m.sender].coin += juego.apuesta * 2;
            return conn.reply(m.chat, `🎉 ¡Ganaste! +${juego.apuesta * 2} 💰`, m);
        }
    }

    if (m.text === "retirarse") {
        if (juego.abierta) return conn.reply(m.chat, "⚠️ Ya abriste una caja. Usa *!bomba* para jugar de nuevo.", m);

        global.db.data.users[m.sender].coin += Math.floor(juego.apuesta / 2);
        delete conn.bombaGame[m.sender];

        return conn.reply(m.chat, `💰 Decidiste retirarte. Recuperaste *${Math.floor(juego.apuesta / 2)}* monedas.`, m);
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

handler.help = ['bomba <apuesta>'];
handler.tags = ['game'];
handler.command = ['bomba'];
handler.register = true;
handler.group = true;

export default handler;
