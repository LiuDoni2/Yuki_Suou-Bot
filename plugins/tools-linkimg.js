import https from 'https';
import { URLSearchParams } from 'url';

const IMGBB_API_KEY = 'TU_API_KEY';

async function subirImagenAImgBB(buffer) {
  return new Promise((resolve, reject) => {
    const base64Image = buffer.toString('base64'); 

    const params = new URLSearchParams();
    params.append('key', IMGBB_API_KEY);
    params.append('image', base64Image);

    const opciones = {
      hostname: 'api.imgbb.com',
      path: '/1/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const req = https.request(opciones, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const respuesta = JSON.parse(data);
          if (respuesta.success) {
            resolve(respuesta.data.url); 
          } else {
            reject('⚠️ No se pudo subir la imagen a ImgBB.');
          }
        } catch (e) {
          reject('⚠️ Error al analizar la respuesta.');
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Error en la subida:', err);
      reject('🚨 Error en la conexión con ImgBB.');
    });

    req.write(params.toString());
    req.end();
  });
}

let handler = async (m, { conn }) => {
  try {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || '';

    if (!/image/.test(mime)) {
      return m.reply('📷 Envía o responde a una imagen para subirla a ImgBB.');
    }

    let img = await q.download?.();
    if (!img) return m.reply('⚠️ No se pudo descargar la imagen.');

    let urlImagen = await subirImagenAImgBB(img);

    m.reply(`✅ Imagen subida con éxito: ${urlImagen}`);
  } catch (error) {
    console.error(error);
    m.reply('❌ Error al subir la imagen.');
  }
};

handler.help = ['subirimagen'];
handler.tags = ['tools'];
handler.command = ['subirimagen', 'linkimg'];
handler.register = true;

export default handler;
