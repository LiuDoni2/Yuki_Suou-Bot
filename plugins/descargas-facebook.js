import fetch from 'node-fetch';

// Constantes para emojis y mensajes
const emoji = '📥';
const error = '❌';
const done = '✅';
const rwait = '⏳';

const handler = async (m, { text, conn, args }) => {
  if (!args[0]) {
    return conn.reply(m.chat, `${emoji} Por favor, ingresa un enlace de Facebook.`, m);
  }

  const fbRegex = /(?:https?:\/\/)?(?:www\.)?(facebook\.com|fb\.watch)\/\S+/i;
  if (!fbRegex.test(args[0])) {
    return conn.reply(m.chat, `😿 Enlace inválido. Asegúrate de que sea un enlace válido de Facebook o fb.watch.`, m);
  }

  await conn.sendMessage(m.chat, { react: { text: rwait, key: m.key } });

  const url = args[0];
  const apiURL = `https://api.dorratz.com/fbvideo?url=${encodeURIComponent(url)}`;
  let selectedVideo;

  try {
    const res = await fetch(apiURL, { timeout: 15000 }); // Añadir un timeout al fetch
    if (!res.ok) {
      let errorMsg = res.statusText;
      try {
        const errorBody = await res.json();
        errorMsg = errorBody.message || errorBody.error || errorMsg;
      } catch (e) { /* Ignora errores al leer el cuerpo del error */ }
      await conn.sendMessage(m.chat, { react: { text: error, key: m.key } });
      console.error(`Error de API [${res.status}]: ${errorMsg}`);
      return conn.reply(m.chat, `😿 Error al obtener datos de la API (${res.status}): ${errorMsg}. Intenta de nuevo.`, m);
    }

    const jsonResponse = await res.json();

    if (!Array.isArray(jsonResponse) || jsonResponse.length === 0) {
      await conn.sendMessage(m.chat, { react: { text: error, key: m.key } });
      console.error("Respuesta inesperada de la API:", jsonResponse);
      return conn.reply(m.chat, `😿 La API no devolvió resultados válidos o el formato es incorrecto.`, m);
    }

    selectedVideo = jsonResponse.find(v => v.resolution && v.resolution.includes('720p') && v.shouldRender === false);
    if (!selectedVideo) {
      selectedVideo = jsonResponse.find(v => v.resolution && v.resolution.includes('HD'));
    }
    if (!selectedVideo) {
      selectedVideo = jsonResponse.find(v => v.resolution && v.resolution.includes('1080p'));
    }
    if (!selectedVideo) {
      selectedVideo = jsonResponse[0];
    }

    if (!selectedVideo || !selectedVideo.url) {
      await conn.sendMessage(m.chat, { react: { text: error, key: m.key } });
      console.error("No se encontró URL en el video seleccionado:", selectedVideo);
      return conn.reply(m.chat, `😿 No se encontró una URL de video válida en la respuesta de la API.`, m);
    }

  } catch (err) {
    console.error('Error conectando o procesando la API:', err);
    await conn.sendMessage(m.chat, { react: { text: error, key: m.key } });
    // Diferenciar error de timeout
    if (err.type === 'request-timeout' || (err.message && err.message.includes('timeout'))) {
        return conn.reply(m.chat, `⚠️ La API tardó demasiado en responder. Intenta de nuevo más tarde.`, m);
    }
    return conn.reply(m.chat, `⚠️ Error interno al conectar o procesar la API. Detalles: ${err.message}`, m);
  }

  // --- Envío del archivo ---
  try {
    let videoUrl = selectedVideo.url;
    const resolution = selectedVideo.resolution || 'Desconocida';

    // El ejemplo de API muestra una URL absoluta de d.rapidcdn.app.
    // Si la URL *fuera* relativa y viniera de d.rapidcdn.app, este bloque sería incorrecto.
    // Si la URL *fuera* relativa y viniera de api.dorratz.com, este bloque sería correcto.
    // Dado que es absoluta, este bloque no se activa para la URL del video.
    if (videoUrl.startsWith('/')) {
      // Asumimos que si es relativa, es relativa al host de la API original
      // ¡Cuidado! Esto podría no ser siempre el caso si la URL relativa pertenece a otro dominio.
      // Para d.rapidcdn.app, si fuera relativa, la base sería https://d.rapidcdn.app
      // Pero la API de ejemplo da una URL absoluta.
      videoUrl = 'https://api.dorratz.com' + videoUrl;
    }

    // Sanear la resolución para usarla en el nombre del archivo
    const safeResolution = resolution.replace(/\s*\(HD\)\s*|\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''); // Ej: 720p_HD o 1080p
    const nombreArchivo = `facebook_video_${safeResolution || 'video'}.mp4`;
    const caption = `乂  ¡FACEBOOK - VIDEO!  乂\n\n✨ Resolución: ${resolution}\n\n📎 Archivo : ${nombreArchivo}\n📩 Origen : Facebook`;

    await conn.sendFile(
      m.chat,
      videoUrl,
      nombreArchivo,
      caption,
      m
    );
    await conn.sendMessage(m.chat, { react: { text: done, key: m.key } });

  } catch (err) {
    console.error('Error al enviar archivo:', err);
    console.error('Video seleccionado que falló:', selectedVideo); // Log para depuración

    // Construye la URL de fallback usando la URL original de selectedVideo.url
    // ya que es la que se intentó enviar (o su versión absoluta si se modificó)
    let fallbackUrl = selectedVideo.url;
     if (selectedVideo.url.startsWith('/')) { // Revisa la URL original de selectedVideo
         // Aquí aplicamos la misma lógica de arriba, asumiendo que si es relativa, es de api.dorratz.com
         // Esto necesita ser verificado si la API puede devolver URLs relativas de otros dominios.
         fallbackUrl = 'https://api.dorratz.com' + selectedVideo.url;
     }
    // Si la URL no era relativa, fallbackUrl ya es la URL correcta.

    await conn.reply(m.chat, `⚠️ No se pudo enviar el archivo (${selectedVideo.resolution || 'Desconocida'}), pero aquí tienes el link directo:\n${fallbackUrl}\n\n(Error: ${err.message})`, m);
    await conn.sendMessage(m.chat, { react: { text: error, key: m.key } });
  }
};

handler.help = ['facebook', 'fb', 'fbdl'];
handler.tags = ['descargas'];
handler.command = ["facebook", "fb", "fbdl"];
handler.group = true;
handler.coin = 10;

export default handler;
