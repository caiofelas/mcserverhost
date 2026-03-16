const http = require('http');
const mineflayer = require('mineflayer');
const fs = require('fs');

// Servidor Web para manter o Render/Hospedagem ativa
http.createServer((req, res) => {
  res.write("Bot Supervisor esta vivo!");
  res.end();
}).listen(8080);

const config = {
    host: '365478.mcsh.io', 
    port: 25565,
    username: 'SupervisorBot',
    version: '1.21.1' // Certifique-se que esta versão coincide com o servidor
};

// Função para carregar as palavras do JSON
function getForbiddenWords() {
    try {
        const data = fs.readFileSync('./filtro.json', 'utf8');
        const json = JSON.parse(data);
        return json.forbiddenWords;
    } catch (err) {
        console.error("[ERRO] Não foi possível carregar o arquivo filtro.json:", err);
        return [];
    }
}

function createBot() {
    const bot = mineflayer.createBot(config);
    const forbiddenWords = getForbiddenWords();

    bot.once('spawn', () => {
        console.log(`[SISTEMA] ${bot.username} está online e patrulhando!`);
        // O bot tenta entrar em modo espectador para não interferir no jogo
        bot.chat('/gamemode spectator'); 

        // Anti-AFK simples (Gira a cabeça a cada 60s)
        setInterval(() => {
            if (bot.entity) {
                const yaw = bot.entity.yaw + 0.5;
                bot.look(yaw, bot.entity.pitch);
            }
        }, 60000); 
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;

        const msgLower = message.toLowerCase();

        // Verifica se a mensagem contém palavras proibidas
        const hasForbiddenWord = forbiddenWords.some(word => {
            // Regex com \b garante que a palavra seja exata (evita banir "curso" por causa de "cu")
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(msgLower);
        });
        
        if (hasForbiddenWord) {
            console.log(`[ALERTA] ${username} violou as regras: "${message}"`);
            // Expulsa o jogador imediatamente
            bot.chat(`/kick ${username} Linguagem ofensiva ou proibida detectada pelo Supervisor.`);
        }

        // Comando de ajuda
        if (msgLower === '!regras') {
            bot.chat('Regras: 1. Sem hacks. 2. Sem ofensas/preconceito. 3. Respeite os outros!');
        }
    });

    bot.on('playerJoined', (player) => {
        if (player.username !== bot.username) {
            setTimeout(() => {
                bot.chat(`/msg ${player.username} Bem-vindo! Sou o Supervisor. O chat é monitorado contra ofensas e racismo.`);
            }, 3000);
        }
    });

    // Tratamento de erros e reconexão
    bot.on('end', () => {
        console.log('[SISTEMA] Conexão perdida. Reconectando em 10 segundos...');
        setTimeout(createBot, 10000);
    });

    bot.on('error', (err) => {
        console.log('[ERRO] Ocorreu um problema na conexão:', err.message);
    });
}

createBot();
