let handler = async (m, { conn, text, usedPrefix, command }) => {

    if (m.mentionedJid && m.mentionedJid.length === 2) {
        let person1 = m.mentionedJid[0];
        let person2 = m.mentionedJid[1];
        let name1 = await conn.getName(person1);
        let name2 = await conn.getName(person2);
        let name3 = await conn.getName(m.sender);

        const pp = './src/imagen.jpg'; // Verifica que esta imagen existe
        const defaultImage = 'https://imgur.com/Aof56Di'; // Imagen de respaldo
        let imageToSend = pp || defaultImage;

        let trio = `\t\t*🔥 TRÍO VIOLENTOOOO! 🔥*
        
💖 ${name1} y ${name2} tienen un *${Math.floor(Math.random() * 100)}%* de compatibilidad como pareja.
💞 ${name1} y ${name3} tienen un *${Math.floor(Math.random() * 100)}%* de compatibilidad.
💕 ${name2} y ${name3} tienen un *${Math.floor(Math.random() * 100)}%* de compatibilidad.
  
🔥 ¿Qué opinas de un trío? 😏`;

        await conn.sendMessage(m.chat, { 
            image: { url: imageToSend }, 
            caption: trio, 
            mentions: [person1, person2, m.sender] 
        }, { quoted: m });

    } else {
        const emoji = '😂';
        conn.reply(m.chat, `${emoji} Menciona a 2 usuarios más para calcular la compatibilidad.`, m);
    }
}

handler.help = ['formartrio @usuario1 @usuario2'];
handler.tags = ['fun'];
handler.command = ['formartrio'];
handler.group = true;
handler.register = true;

export default handler;
