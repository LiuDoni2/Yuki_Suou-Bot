const { generateWAMessageFromContent, proto } = (await import('@whiskeysockets/baileys')).default

var handler = async (m, { conn, text}) => {

conn.reply(m.chat, `${emoji2} Buscando una frase, espere un momento...`, m)

conn.reply(m.chat, `*┏━_͜͡-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡⚘-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡⚘-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡⚘-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡_͜͡━┓*\n\n❥ *"${pickRandom(global.frases)}"*\n\n*┗━_͜͡-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡⚘-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡⚘-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡⚘-͜͡-͜͡-͜͡-͜͡-͜͡-͜͡_͜͡━┛*`, m)

}
handler.help = ['frase']
handler.tags = ['fun']
handler.command = ['frase']
handler.fail = null
handler.exp = 0
handler.group = true;
handler.register = true

export default handler

let hasil = Math.floor(Math.random() * 5000)
function pickRandom(list) {
return list[Math.floor(list.length * Math.random())]
}

global.frases = [
    "La victoria no es todo... sino solo un medio para entender el mundo. (Kiyotaka Ayanokoji, *Classroom of the Elite*)",
    "El verdadero poder no está en derrotar a otros, sino en dominar tus propias debilidades. (Kiyotaka Ayanokoji, *Classroom of the Elite*)",
    "La inteligencia sin empatía es solo un instrumento sin rumbo. (Kiyotaka Ayanokoji, *Classroom of the Elite*)",
    "En un sistema corrupto, incluso el 'éxito' es una ilusión. (Kiyotaka Ayanokoji, *Classroom of the Elite*)",
    "¿Qué valor tiene la inteligencia si no se usa para comprender al prójimo? (Kiyotaka Ayanokoji, *Classroom of the Elite*)",
    "La existencia no tiene significado intrínseco... pero eso no nos impide darle un propósito. (Satoru Fujinuma, *Date A Live*)",
    "¿Qué somos si no enfrentamos desafíos que superan nuestras capacidades? (Tanikaze Komori, *Re:Zero*)",
    "La memoria no es solo el pasado... es el puente entre la vida y la muerte. (Rem, *Sword Art Online*)",
    "¿Es la suerte algo que se recibe... o algo que se forja en la oscuridad? (Puck, *Overlord*)",
    "El dolor nos hace humanos... pero la forma en que lo superamos nos define como seres conscientes. (Diabel, *Sword Art Online*)",
    "¿Qué valor tiene el coraje si no se usa para proteger a los débiles? (Melty, *Melty Blood*)",
    "La verdad duele... pero la ignorancia es una cadena invisible. (Ludeke, *The Rising of the Shield Hero*)",
    "¿Podemos llamar 'vida' a algo que solo existe en los ojos de otros? (Charlotte Doles, *Charlotte*)",
    "El tiempo no avanza en línea recta... sino en espirales que repiten la misma tristeza. (Emilia, *The Rising of the Shield Hero*)",
    "¿Es el libre albedrío real si nuestro destino está escrito en otro mundo? (Shinobu Okiya, *Another Eden*)",
    "El mundo no es cruel... solo es ciego. (Light Yagami, *Death Note*)",
    "¿Es el sufrimiento una debilidad... o la semilla de la cual nace la verdadera fuerza? (Ainz Ooal Gown, *Overlord*)",
    "¿Podemos escapar del ciclo de destrucción si somos parte de él? (Eren Yeager, *Attack on Titan*)",
    "La mente humana es el único límite... pero ¿y si ese límite es ilimitado? (Genos, *One Punch Man*)",
    "¿Es la amistad solo un contrato temporal... o algo que trasciende el tiempo? (Makima, *Chainsaw Man*)",
    "¿Es la justicia una fuerza que une... o un lazo que nos ata a la ilusión? (Yuzuru Otonashi, *Angel Beats!*)",
    "El significado de la vida... es encontrar tu propia pregunta, no la respuesta. (Kotarō Bessho, *Toriko*)",
    "El dolor nos humaniza... pero la resiliencia nos diviniza. (Mikasa Ackerman, *Attack on Titan*)",
    "¿Es la muerte el final... o el comienzo de una nueva forma de existir? (Emilia, *The Rising of the Shield Hero*)",
    "La soledad no es el estar solo... sino el no ser comprendido. (Kurapika, *Hunter x Hunter*)",
    "¿Qué es más peligroso: creer en fantasías... o vivir sin creer en nada? (Killua Zoldyck, *Hunter x Hunter*)",
    "La valentía no es carecer de miedo... sino caminar hacia él con los ojos abiertos. (Asuka Langley, *Neon Genesis Evangelion*)",
    "¿Podemos elegir nuestro destino... o solo aprender a vivir con él? (Akihisa Yoshimura, *Another*)",
    "La esperanza es el último lujo que un ser humano se permite antes de caer. (Kyohei Katsuragi, *Psycho-Pass*)",
    "La vida no es un derecho... sino un privilegio que debemos honrar con acciones. (Mikasa Ackerman, *Attack on Titan*)",
    "El tiempo no se detiene... pero nosotros podemos detenernos a entenderlo. (Shinji Ikari, *Neon Genesis Evangelion*)",
    "¿Es el amor una fuerza que une... o un lazo que nos ata a la ilusión? (Yuzuru Otonashi, *Angel Beats!*)",
    "La mente humana es un laberinto... pero el coraje es el hilo que nos guía. (Eugeo, *Another Eden*)",
    "La humanidad no evoluciona... solo se reinventa la misma traición. (Levi Ackerman, *Attack on Titan*)",
    "¿Podemos llamar 'éxito' a algo que destruye lo que más queremos? (Eugeo, *Another Eden*)",
    "La bondad sin propósito es solo una ilusión... como un sueño en un mundo sin luz. (Eclipses, *Eclipses*)",
    "¿Qué somos sin la capacidad de elegir? (Zero Two, *Sword Art Online: Unital Ring*)",
    "La ambición no justifica el precio que pagamos por ella. (Guts, *Berserk*)",
    "¿Es la paz posible si primero no nos comprendemos a nosotros mismos? (Itachi Uchiha, *Naruto*)",
];
