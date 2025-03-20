const cooldowns = {};
const TIEMPO_ESPERA = 5 * 60 * 1000;

const handler = async (m, { conn }) => {
    const user = global.db.data.users[m.sender] || {};
    user.coin = user.coin || 0;

    if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < TIEMPO_ESPERA) {
        let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + TIEMPO_ESPERA - Date.now()) / 1000));
        return conn.reply(m.chat, `⏳ ¡Espera un poco! Debes descansar *${tiempoRestante}* antes de volver a trabajar. 😴`, m);
    }

    cooldowns[m.sender] = Date.now();

    let rsl = Math.floor(Math.random() * 350) + 50;
    const trabajoElegido = pickRandom(trabajos);

    const animacion = [
        `⚙️ Buscando un trabajo...`,
        `👨‍💻 ¡Manos a la obra! Estás trabajando como ${trabajoElegido.split(" ")[1]}...`,
        `📈 ¡Casi terminas tu jornada!`,
    ];

    let { key } = await conn.sendMessage(m.chat, { text: animacion[0] }, { quoted: m });

    for (let i = 1; i < animacion.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await conn.sendMessage(m.chat, { text: animacion[i], edit: key });
    }

    user.coin += rsl;

    await new Promise(resolve => setTimeout(resolve, 2000));

    const moneda = '${moneda}; // Puedes definir tu moneda aquí si no lo tienes globalmente
    const mensajeFinal = `✅ ¡Excelente trabajo! Has completado tu tarea como ${trabajoElegido.substring(2)} y recibes *${toNum(rsl)}* ${moneda} 💰.\n\n📊 *Balance Actual:* ${user.coin} ${moneda}`;
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
    "🛠️ Cortador de galletas",
    "🔫 Trabajador en una empresa militar privada",
    "🍷 Organizador de un evento de cata de vinos",
    "🧹 Limpiador de chimeneas",
    "🎮 Desarrollador de juegos",
    "💼 Empleado de oficina",
    "🎭 Actor/Actriz en una obra de teatro",
    "🍔 Cocinero(a) en un restaurante local",
    "📝 Escritor de frases para galletas de la fortuna",
    "🛍️ Comerciante de artículos",
    "🔧 Técnico de reparación de máquinas recreativas",
    "🚜 Agricultor de vegetales",
    "🎨 Artista callejero",
    "🏰 Constructor de castillos de arena para turistas",
    "🛠️ Persona disfrazada de panda en Disneyland",
    "📷 Vendedor de fotos de paisajes",
    "🚗 Conductor de taxis",
    "👨‍🍳 Chef en una fiesta",
    "💻 Diseñador de logos para una empresa",
    "🎤 Imitador de voces de personajes animados",
    "🛸 Diseñador de platillos voladores de juguete",
    "🎩 Mago en fiestas infantiles",
    "🍕 Malabarista de pizzas en una pizzería",
    "🎻 Violinista en el metro",
    "🦸‍♂️ Superhéroe callejero improvisado",
    "🧁 Vendedor de cupcakes temáticos en ferias",
    "🐠 Alimentador de peces en un acuario gigante",
    "🛶 Gondolero para turistas",
    "🦜 Entrenador de loros para decir frases graciosas",
    "🎥 Extra en películas de acción",
    "🐉 Diseñador de dragones de papel para festivales",
    "📚 Narrador de cuentos en una librería",
    "🚲 Repartidor en bicicleta por la ciudad",
    "🧙‍♂️ Profesor de trucos de magia en una escuela",
    "🚀 Diseñador de modelos de cohetes en miniatura",
    "🌮 Crítico gastronómico de tacos",
    "🛏️ Probador de colchones para una empresa de descanso",
    "🌊 Instructor de surf en una isla paradisíaca",
    "🦄 Diseñador de disfraces de unicornios personalizados",
    "🐧 Cuidador de pingüinos en un zoológico",
    "💡 Inventor de nombres creativos para productos",
    "🏴‍☠️ Pirata en un parque temático",
    "🦷 'Hada de los dientes' de alquiler",
    "🚜 Conductor de tractor en una granja de girasoles",
    "👽 Actor disfrazado de alienígena en eventos de ciencia ficción"
];
