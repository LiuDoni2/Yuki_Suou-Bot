import { format } from 'util';
const debugMode = false;
const winScore = 4999;
const playScore = 99;

export async function before(m, { conn }) {
  let ok;
  let isWin = false;
  let isTie = false;
  let isSurrender = false;
  conn.game = conn.game || {};
  const room = Object.values(conn.game).find((room) =>
    room.id &&
    room.game &&
    room.state &&
    room.id.startsWith('tictactoe') &&
    [room.game.playerX, room.game.playerO].includes(m.sender) &&
    room.state === 'PLAYING'
  );
  if (room) {
    if (!/^([1-9]|(me)?nyerah|rendirse|surr?ender)$/i.test(m.text)) {
      return true;
    }
    isSurrender = !/^[1-9]$/.test(m.text);
    if (m.sender !== room.game.currentTurn && !isSurrender) {
      return true;
    }
    if (debugMode) {
      m.reply('[DEBUG]\n' + format({ isSurrender, text: m.text }));
    }
    if (!isSurrender && (ok = room.game.turn(m.sender === room.game.playerO, parseInt(m.text) - 1)) < 1) {
      const mensajes = {
        '-3': 'El juego ha terminado',
        '-2': 'Inválido',
        '-1': 'Posición inválida',
        '0': 'Posición inválida',
      };
      m.reply(mensajes[ok]);
      return true;
    }
    if (!isSurrender) {
      if (m.sender === room.game.winner) {
        isWin = true;
      } else if (room.game.board === 511) {
        isTie = true;
      }
    } else {
      room.game.currentTurn = m.sender === room.game.playerX ? room.game.playerO : room.game.playerX;
      isWin = true;
    }
    const winner = isSurrender ? room.game.currentTurn : room.game.winner;
    const arr = room.game.render().map((v) => {
      return {
        X: '❎',
        O: '⭕',
        1: '1️⃣',
        2: '2️⃣',
        3: '3️⃣',
        4: '4️⃣',
        5: '5️⃣',
        6: '6️⃣',
        7: '7️⃣',
        8: '8️⃣',
        9: '9️⃣',
      }[v];
    });
    
    // Actualizar el chat del jugador en caso de que no coincida
    if (m.sender === room.game.playerX && room.x !== m.chat) {
      room.x = m.chat;
    } else if (m.sender === room.game.playerO && room.o !== m.chat) {
      room.o = m.chat;
    }
    
    const str = `
🎮 TRES EN RAYA 🎮

❎ = @${room.game.playerX.split('@')[0]}
⭕ = @${room.game.playerO.split('@')[0]}

        ${arr.slice(0, 3).join('')}
        ${arr.slice(3, 6).join('')}
        ${arr.slice(6).join('')}

${isWin 
  ? `@${winner.split('@')[0]} Ganaste 🥳, Te llevas +${winScore} XP` 
  : isTie 
    ? 'El juego terminó en empate 😐' 
    : `Turno de @${room.game.currentTurn.split('@')[0]}`}
    `.trim();
    
    if (room.x !== room.o) {
      await conn.sendMessage(room.x, { text: str, mentions: conn.parseMention(str) }, { quoted: m });
    }
    await conn.sendMessage(room.o, { text: str, mentions: conn.parseMention(str) }, { quoted: m });
    
    if (isTie || isWin) {
      const users = global.db.data.users;
      users[room.game.playerX].exp += playScore;
      users[room.game.playerO].exp += playScore;
      if (isWin) {
        users[winner].exp += winScore - playScore;
      }
      if (debugMode) {
        m.reply('[DEBUG]\n' + format(room));
      }
      delete conn.game[room.id];
    }
  }
  return true;
}
