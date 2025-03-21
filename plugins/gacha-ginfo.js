import { getCooldown } from './cooldowns.js';

const handler = async (m, { conn }) => {
    const userId = m.sender;

    let tiempos = {
        "#vote": getCooldown(userId, "vote"),
        "#rw": getCooldown(userId, "rollwaifu"),
        "#c": getCooldown(userId, "claim")
    };

    let mensaje = "🕒 *Tiempos de Espera*\n\n";

    Object.entries(tiempos).forEach(([comando, tiempo]) => {
        if (tiempo > 0) {
            let minutos = Math.floor((tiempo / 1000 / 60) % 60);
            let segundos = Math.floor((tiempo / 1000) % 60);
            mensaje += `🔹 ${comando}: ⏳ ${minutos}m ${segundos}s restantes\n`;
        } else {
            mensaje += `> ✅ ${comando}: ¡Disponible!\n`;
        }
    });

    await conn.reply(m.chat, mensaje, m);
};

handler.help = ['ginfo'];
handler.tags = ['gacha'];
handler.command = ['ginfo'];
handler.group = true;

export default handler;
