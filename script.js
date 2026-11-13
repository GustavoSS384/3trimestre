const canvas = document.getElementById("telaEnduro");
const ctx = canvas.getContext("2d");

// Elementos do HUD
const hudVelocidade = document.getElementById("hud-velocidade");
const hudPontos = document.getElementById("hud-pontos");
const hudRecorde = document.getElementById("hud-recorde");
const btnReiniciar = document.getElementById("btnReiniciar");

// Estado do jogo
let jogoAtivo = true;
let pontos = 0;
let recorde = localStorage.getItem("recordeEnduro") || 0;
hudRecorde.innerText = recorde;

let velocidade = 5;
const velocidadeMin = 3;
const velocidadeMax = 14;
let deslocamentoPista = 0;
let tempoCiclo = 0; // Controla dia, tarde e noite

// Jogador
const jogador = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 90,
    largura: 40,
    altura: 65,
    velocidadeLateral: 6,
    cor: "#e74c3c"
};

// Inimigos e controles
let inimigos = [];
const teclas = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

// Eventos de teclado
document.addEventListener("keydown", (e) => {
    if (e.key in teclas) {
        e.preventDefault(); // Evita que a página role ao usar as setas
        teclas[e.key] = true;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key in teclas) {
        teclas[e.key] = false;
    }
});

btnReiniciar.addEventListener("click", reiniciarJogo);

// Função para definir as cores do clima (Dia -> Tarde -> Noite)
function obterClima() {
    const fase = Math.floor(tempoCiclo / 1000) % 3;
    if (fase === 0) {
        // Dia
        return { ceu: "#3498db", grama: "#27ae60", asfalto: "#34495e", noite: false };
    } else if (fase === 1) {
        // Pôr do sol
        return { ceu: "#e67e22", grama: "#d35400", asfalto: "#2c3e50", noite: false };
    } else {
        // Noite
        return { ceu: "#0b0c10", grama: "#141e18", asfalto: "#111111", noite: true };
    }
}

// Desenha um carro estilo retrô
function desenharCarro(x, y, largura, altura, cor, isInimigo, isNoite) {
    // Se for noite e for inimigo, desenha apenas as lanternas traseiras (igual ao Atari!)
    if (isNoite && isInimigo) {
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(x + 4, y + altura - 8, 8, 6);
        ctx.fillRect(x + largura - 12, y + altura - 8, 8, 6);
        return;
    }

    // Corpo do carro
    ctx.fillStyle = cor;
    ctx.fillRect(x + 5, y, largura - 10, altura);

    // Rodas
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y + 10, 5, 14);
    ctx.fillRect(x + largura - 5, y + 10, 5, 14);
    ctx.fillRect(x, y + altura - 22, 5, 14);
    ctx.fillRect(x + largura - 5, y + altura - 22, 5, 14);

    // Para-brisa
    ctx.fillStyle = "#aed6f1";
    ctx.fillRect(x + 9, y + 16, largura - 18, 12);

    // Faróis do jogador à noite
    if (isNoite && !isInimigo) {
        ctx.fillStyle = "rgba(255, 255, 150, 0.25)";
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x - 25, y - 130);
        ctx.lineTo(x + largura + 25, y - 130);
        ctx.lineTo(x + largura - 8, y);
        ctx.fill();
    }
}

function criarInimigo() {
    const margemPista = 65;
    const larguraCarro = 40;
    const minX = margemPista + 10;
    const maxX = canvas.width - margemPista - larguraCarro - 10;
    const posX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

    const cores = ["#f1c40f", "#9b59b6", "#1abc9c", "#ecf0f1", "#3498db"];
    const corAleatoria = cores[Math.floor(Math.random() * cores.length)];

    inimigos.push({
        x: posX,
        y: -80,
        largura: larguraCarro,
        altura: 65,
        cor: corAleatoria,
        velocidadePropria: Math.random() * 2 + 2
    });
}

function atualizar() {
    if (!jogoAtivo) return;

    tempoCiclo++;

    // Controle de aceleração e freio
    if (teclas.ArrowUp && velocidade < velocidadeMax) {
        velocidade += 0.1;
    } else if (teclas.ArrowDown && velocidade > velocidadeMin) {
        velocidade -= 0.15;
    } else if (velocidade > 5) {
        velocidade -= 0.03; // Desaceleração natural
    }

    // Movimento lateral do jogador
    const limiteEsquerdo = 65;
    const limiteDireito = canvas.width - 65 - jogador.largura;

    if (teclas.ArrowLeft && jogador.x > limiteEsquerdo) {
        jogador.x -= jogador.velocidadeLateral;
    }
    if (teclas.ArrowRight && jogador.x < limiteDireito) {
        jogador.x += jogador.velocidadeLateral;
    }

    // Atualiza faixas da pista
    deslocamentoPista += velocidade;
    if (deslocamentoPista >= 40) {
        deslocamentoPista = 0;
    }

    // Gera inimigos conforme a velocidade
    if (Math.random() < 0.025 && (inimigos.length === 0 || inimigos[inimigos.length - 1].y > 140)) {
        criarInimigo();
    }

    // Atualiza posição dos inimigos e verifica colisões
    for (let i = inimigos.length - 1; i >= 0; i--) {
        let inimigo = inimigos[i];
        inimigo.y += velocidade - inimigo.velocidadePropria;

        // Verifica batida
        if (
            jogador.x < inimigo.x + inimigo.largura - 4 &&
            jogador.x + jogador.largura - 4 > inimigo.x &&
            jogador.y < inimigo.y + inimigo.altura - 4 &&
            jogador.y + jogador.altura - 4 > inimigo.y
        ) {
            encerrarJogo();
        }

        // Ultrapassagem concluída
        if (inimigo.y > canvas.height) {
            inimigos.splice(i, 1);
            pontos++;
            hudPontos.innerText = pontos;
        }
    }

    // Atualiza velocímetro na tela
    hudVelocidade.innerText = Math.floor(velocidade * 22);
}

function desenhar() {
    const clima = obterClima();
    const margemPista = 60;

    // Fundo (Grama/Acostamento)
    ctx.fillStyle = clima.grama;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Asfalto
    ctx.fillStyle = clima.asfalto;
    ctx.fillRect(margemPista, 0, canvas.width - margemPista * 2, canvas.height);

    // Zebras laterais da pista
    for (let y = -40; y < canvas.height; y += 40) {
        let posY = y + deslocamentoPista;
        ctx.fillStyle = Math.floor((y + 40) / 40) % 2 === 0 ? "#ffffff" : "#e74c3c";
        ctx.fillRect(margemPista - 8, posY, 8, 40);
        ctx.fillRect(canvas.width - margemPista, posY, 8, 40);
    }

    // Faixa central tracejada
    ctx.fillStyle = "#ffffff";
    for (let y = -40; y < canvas.height; y += 80) {
        ctx.fillRect(canvas.width / 2 - 3, y + deslocamentoPista, 6, 40);
    }

    // Horizonte/Céu no topo
    ctx.fillStyle = clima.ceu;
    ctx.fillRect(0, 0, canvas.width, 60);

    // Desenha carros inimigos
    inimigos.forEach((inimigo) => {
        desenharCarro(inimigo.x, inimigo.y, inimigo.largura, inimigo.altura, inimigo.cor, true, clima.noite);
    });

    // Desenha jogador
    desenharCarro(jogador.x, jogador.y, jogador.largura, jogador.altura, jogador.cor, false, clima.noite);

    // Tela de Fim de Jogo
    if (!jogoAtivo) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("FIM DE JOGO!", canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = "18px 'Courier New', monospace";
        ctx.fillText(`Carros ultrapassados: ${pontos}`, canvas.width / 2, canvas.height / 2 + 20);
    }
}

function encerrarJogo() {
    jogoAtivo = false;
    btnReiniciar.style.display = "inline-block";

    if (pontos > recorde) {
        recorde = pontos;
        localStorage.setItem("recordeEnduro", recorde);
        hudRecorde.innerText = recorde;
    }
}

function reiniciarJogo() {
    jogoAtivo = true;
    pontos = 0;
    velocidade = 5;
    tempoCiclo = 0;
    inimigos = [];
    jogador.x = canvas.width / 2 - 20;
    hudPontos.innerText = "0";
    btnReiniciar.style.display = "none";
}

function loopPrincipal() {
    atualizar();
    desenhar();
    requestAnimationFrame(loopPrincipal);
}

// Inicia o jogo
loopPrincipal();

