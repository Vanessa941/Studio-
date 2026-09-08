// Garantir que o DOM está pronto antes de rodar
document.addEventListener("DOMContentLoaded", () => {
    let currentTab = 'url';

    // ELEMENTOS DO GERADOR
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const btnGenerate = document.getElementById('btn-generate');
    const btnDownloadPng = document.getElementById('btn-download-png');
    const btnDownloadSvg = document.getElementById('btn-download-svg');

    // LÓGICA DE ALTERNAR ABAS
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            currentTab = targetTab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            e.target.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

    // COMPILAR TEXTO DE ACORDO COM A ABA
    function getQRText() {
        if (currentTab === 'url') {
            return document.getElementById('input-url').value.trim();
        } else if (currentTab === 'wifi') {
            const ssid = document.getElementById('wifi-ssid').value.trim();
            const pass = document.getElementById('wifi-pass').value.trim();
            const type = document.getElementById('wifi-type').value;
            if (!ssid) return '';
            return `WIFI:S:${ssid};T:${type};P:${pass};;`;
        } else if (currentTab === 'pix') {
            return document.getElementById('input-pix').value.trim();
        }
        return '';
    }

    // EVENTO DO BOTÃO GERAR
    btnGenerate.addEventListener('click', () => {
        const text = getQRText();
        const displayDiv = document.getElementById('qrcode-display');
        
        if (!text) {
            alert('Por favor, insira as informações antes de gerar.');
            return;
        }

        displayDiv.innerHTML = ''; // Limpa geração anterior

        const colorDark = document.getElementById('color-dark').value;
        const colorLight = document.getElementById('color-light').value;

        // Gera o QR code usando a biblioteca injetada no escopo global
        new QRCode(displayDiv, {
            text: text,
            width: 256,
            height: 256,
            colorDark: colorDark,
            colorLight: colorLight,
            correctLevel: QRCode.CorrectLevel.H
        });

        // Mostra a área dos botões de download
        document.getElementById('download-area').style.display = 'flex';
    });

    // EVENTOS DE DOWNLOAD
    btnDownloadPng.addEventListener('click', () => {
        const img = document.querySelector('#qrcode-display img');
        if (!img) return;
        const link = document.createElement('a');
        link.href = img.src;
        link.download = 'qrcode-hub.png';
        link.click();
    });

    btnDownloadSvg.addEventListener('click', () => {
        const canvas = document.querySelector('#qrcode-display canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'qrcode-hub-hd.png';
        link.click();
    });

    // LÓGICA DO SCANNER (jsQR)
    const video = document.getElementById('webcam');
    const canvasElement = document.getElementById('hidden-canvas');
    const canvas = canvasElement.getContext('2d');
    const loadingMessage = document.getElementById('loading-message');
    const scanResult = document.getElementById('scan-result');

    // Tenta iniciar a webcam apenas se o navegador suportar a API de mídia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function(stream) {
                video.srcObject = stream;
                video.setAttribute('playsinline', true);
                video.play();
                requestAnimationFrame(tick);
            })
            .catch(err => {
                loadingMessage.innerText = 'Câmera bloqueada (Requer HTTPS/Domínio Seguro).';
                console.log('Scanner bloqueado localmente por segurança:', err);
            });
    } else {
        loadingMessage.innerText = 'Seu navegador atual não suporta scanner de câmera de forma local.';
    }

    function tick() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            loadingMessage.style.display = 'none';
            canvasElement.hidden = false;
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            
            // Verifica o frame via jsQR
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });
            
            if (code) {
                scanResult.innerText = code.data;
                scanResult.style.background = '#d1fae5';
                scanResult.style.borderColor = '#10b981';
            }
        }
        requestAnimationFrame(tick);
    }
});
