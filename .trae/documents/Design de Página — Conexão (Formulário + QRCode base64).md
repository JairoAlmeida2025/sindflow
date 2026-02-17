# Design de Página — Conexão (Formulário + QRCode base64)

## Página: Conexão

### 1) Layout
- Abordagem desktop-first.
- Layout principal em **CSS Grid** (2 colunas) para desktop:
  - Coluna esquerda: formulário e ações.
  - Coluna direita: área do QRCode e instruções.
- Responsivo:
  - >= 1024px: grid 12 colunas; formulário ocupa ~5–6 colunas e QRCode ~6–7 colunas.
  - < 1024px: empilhar em uma coluna (formulário acima, QR abaixo).
- Espaçamento: escala 4/8/12/16/24/32px; max-width do conteúdo ~1100–1200px centralizado.

### 2) Meta Information (SEO)
- Title: "Conexão | WhatsApp"
- Description: "Crie uma conexão do WhatsApp e escaneie o QRCode para ativar."
- Open Graph:
  - og:title = "Conexão | WhatsApp"
  - og:description = "Gere um QRCode e conecte seu WhatsApp."
  - og:type = "website"

### 3) Global Styles (tokens sugeridos)
- Background: #0B1220 (ou o background padrão atual do app)
- Surface/Card: #111B2E
- Text primary: #E6EAF2
- Text secondary: #AAB3C5
- Accent/Primary: #3B82F6
- Danger: #EF4444
- Success: #22C55E
- Tipografia:
  - H1 24–28px / semibold
  - H2 18–20px / semibold
  - Body 14–16px
- Inputs:
  - Altura 40–44px, borda 1px (#22304A), foco com outline/accent
- Botões:
  - Primary: fundo Accent, hover escurece ~8%
  - Secondary: fundo transparente + borda
- Links: Accent + underline no hover

### 4) Page Structure
Padrão em seções empilhadas com um “header” pequeno e um grid 2-colunas no corpo.

### 5) Sections & Components

#### 5.1 Header da Página
- Componentes:
  - Título: “Conexão”
  - Texto de apoio: “Informe os dados e gere o QRCode para escanear no WhatsApp.”
- Ações opcionais (se existir navegação do app): breadcrumb ou botão “Voltar”.

#### 5.2 Card: Formulário (coluna esquerda)
- Campos
  1. **Nome da conexão** (text)
     - Placeholder: “Ex.: Atendimento Matriz”
     - Regras: obrigatório; máximo sugerido 60 caracteres.
  2. **Número WhatsApp com DDI** (tel/text)
     - Placeholder: “Ex.: +5511999999999”
     - Regras: obrigatório; normalizar para E.164; bloquear caracteres inválidos quando possível.
- Ações
  - Botão primário: “Gerar QRCode”
  - Estado loading: spinner + texto “Gerando…”; desabilitar campos e botão.
  - Ação secundária (opcional): “Limpar” (reseta campos e QR atual).
- Mensagens de validação
  - Inline abaixo do campo (texto pequeno em Danger).

#### 5.3 Card: QRCode (coluna direita)
- Estados
  1. **Vazio**: ilustração/placeholder + texto “Envie o formulário para gerar o QRCode.”
  2. **Carregando**: skeleton quadrado (ex.: 280x280) + dica “Aguarde o retorno do QRCode.”
  3. **Sucesso**:
     - Render do QR como imagem:
       - Se vier apenas base64: montar `data:{mimeType};base64,{qrCodeBase64}`.
       - Se já vier data URL: usar diretamente.
     - Tamanho: 260–320px (desktop), 220–280px (mobile).
     - Texto de instrução: “Abra o WhatsApp no celular > Dispositivos conectados > Conectar um dispositivo e escaneie.”
     - Botão secundário: “Gerar novamente” (faz novo POST com os mesmos dados).
  4. **Erro**:
     - Banner de erro com mensagem curta (ex.: “Não foi possível gerar o QRCode. Tente novamente.”)
- Observações de UX
  - Manter o último QRCode visível até um novo ser gerado (com overlay de loading) para reduzir frustração.

#### 5.4 Feedback e Tratamento de Erros (global na página)
- Toast/banner no topo do conteúdo para:
  - Falha de rede / timeout.
  - Resposta sem `qrCodeBase64` ou com base64 inválido.
- Botão “Tentar novamente” quando fizer sentido.

### 6) Interações e Estados
- Submit via Enter no formulário.
- Prevenir duplo clique no botão enquanto estiver carregando.
- Acessibilidade:
  - Labels visíveis, aria-describedby para erros.
  - QRCode com alt text: “QRCode para conexão do WhatsApp”.
- Transições:
  - Fade-in leve (150–200ms) ao trocar de placeholder para QRCode.
