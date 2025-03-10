const cooldowns = {};
const TIEMPO_ESPERA = 5 * 60 * 1000; 

const handler = async (m, { conn }) => {
    const user = global.db.data.users[m.sender] || {};
    user.coin = user.coin || 0; 

    if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < TIEMPO_ESPERA) {
        let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + TIEMPO_ESPERA - Date.now()) / 1000));
        return conn.reply(m.chat, `⏱️ Debes esperar *${tiempoRestante}* para volver a trabajar.`, m);
    }

    cooldowns[m.sender] = Date.now();

    let rsl = Math.floor(Math.random() * 350) + 50; 
    const trabajoElegido = pickRandom(trabajos);

    const animacion = [
        `_🛠️ ${trabajoElegido}... ⏳_`,
        `_💼Sigues trabajando...📊_`,
        `_🔨 Casi terminas... 🏗️_`
    ];

    let { key } = await conn.sendMessage(m.chat, { text: animacion[0] }, { quoted: m });

    for (let i = 1; i < animacion.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await conn.sendMessage(m.chat, { text: animacion[i], edit: key });
    }

    user.coin += rsl;

    await new Promise(resolve => setTimeout(resolve, 2000));

    const mensajeFinal = `✅ ${trabajoElegido} y recibes *${toNum(rsl)}* ${moneda} 💰.\n> _*sᥲᥣძ᥆ ᥲᥴ𝗍ᥙᥲᥣ:* ${user.coin} ${moneda}_`;
    await conn.sendMessage(m.chat, { text: mensajeFinal, edit: key });
};

handler.help = ['trabajar'];
handler.tags = ['economy'];
handler.command = ['w', 'work', 'chambear', 'chamba', 'trabajar'];
handler.group = true;
handler.register = true;

export default handler;

function toNum(number) {
    if (Math.abs(number) >= 1_000_000) {
        return (number / 1_000_000).toFixed(1) + 'M';
    } else if (Math.abs(number) >= 1_000) {
        return (number / 1_000).toFixed(1) + 'k';
    }
    return number.toString();
}

function segundosAHMS(segundos) {
    let minutos = Math.floor(segundos / 60);
    let segundosRestantes = segundos % 60;
    return `${minutos} minutos y ${segundosRestantes} segundos`;
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

const trabajos = [
    "🛠️ Trabajas como cortador de galletas",
    "🔫 Trabajas para una empresa militar privada",
    "🍷 Organizas un evento de cata de vinos",
    "🧹 Limpias la chimenea",
    "🎮 Desarrollas juegos",
    "💼 Trabajas en la oficina",
    "🎭 Participas en una obra de teatro",
    "🍔 Trabajas en un restaurante local como cocinero(a)",
    "📝 Escribes frases para galletas de la fortuna",
    "🛍️ Compraste y vendiste artículos",
    "🔧 Reparas máquinas recreativas",
    "🚜 Cultivas vegetales y ganas",
    "🎨 Haces arte callejero y ganas",
    "🏰 Construyes castillos de arena para turistas",
    "🛠️ Trabajas en Disneyland disfrazado de panda",
    "📷 Vendes fotos de paisajes",
    "🚗 Trabajas como conductor de taxis",
    "👨‍🍳 Cocinas para una fiesta",
    "💻 Diseñas un logo para una empresa",
    "🎤 Imitas voces de personajes animados",
    "🛸 Diseñas platillos voladores de juguete",
    "🎩 Trabajas como mago en fiestas infantiles",
    "🍕 Haces malabares con pizzas en una pizzería",
    "🎻 Tocas el violín en el metro",
    "🦸‍♂️ Eres un superhéroe callejero improvisado",
    "🧁 Vendes cupcakes temáticos en ferias",
    "🐠 Alimentas peces en un acuario gigante",
    "🛶 Das paseos en góndola a turistas",
    "🦜 Enseñas a loros a decir frases graciosas",
    "🎥 Extras en películas de acción",
    "🐉 Diseñas dragones de papel para festivales",
    "📚 Eres narrador de cuentos en una librería",
    "🚲 Haces entregas en bicicleta por la ciudad",
    "🧙‍♂️ Enseñas trucos de magia en una escuela",
    "🚀 Diseñas modelos de cohetes en miniatura",
    "🌮 Eres crítico gastronómico de tacos",
    "🛏️ Pruebas colchones para una empresa de descanso",
    "🌊 Eres instructor de surf en una isla paradisíaca",
    "🦄 Diseñas disfraces de unicornios personalizados",
    "🐧 Cuidas pingüinos en un zoológico",
    "💡 Inventas nombres creativos para productos",
    "🏴‍☠️ Haces de pirata en un parque temático",
    "🦷 Ayudas a niños a perder su primer diente como 'Hada de los dientes' de alquiler",
    "🚜 Manejas un tractor en una granja de girasoles",
    "👽 Eres un actor disfrazado de alienígena en eventos de ciencia ficción"
];
