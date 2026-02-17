## 1. Product Overview
Adicionar uma nova página “Conexão” para criar/iniciar uma conexão de WhatsApp via envio de dados para um webhook do n8n e exibição do QRCode retornado em base64.
Você preenche um formulário simples, envia, e o sistema mostra o QRCode para você escanear.

## 2. Core Features

### 2.1 Feature Module
1. **Página Inicial do App**: item de navegação para acessar “Conexão”.
2. **Página Conexão**: formulário (nome da conexão, número WhatsApp com DDI), envio (POST) para webhook n8n, exibição do QRCode retornado em base64.

### 2.2 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Página Inicial do App | Navegação | Exibir link/menu para acessar a página “Conexão”. |
| Página Conexão | Cabeçalho | Exibir título, descrição curta do objetivo e instrução para escanear o QRCode após gerar. |
| Página Conexão | Formulário de Conexão | Capturar “Nome da conexão” e “Número WhatsApp com DDI”. Validar obrigatórios e formato (DDI + número). |
| Página Conexão | Envio para n8n | Enviar POST com os dados do formulário para o webhook do n8n. Bloquear reenvio durante carregamento e exibir feedback de progresso. |
| Página Conexão | QRCode (base64) | Renderizar imagem do QRCode retornado em base64 (ex.: data URL) e permitir regenerar (novo POST) se necessário. |
| Página Conexão | Tratamento de erros | Exibir mensagem clara quando o POST falhar ou quando a resposta não contiver um QRCode válido. |

## 3. Core Process
Você acessa a “Conexão” pelo menu da página inicial do app, preenche nome da conexão e o número do WhatsApp com DDI e envia. O sistema faz um POST no webhook do n8n e, ao receber o QRCode em base64, renderiza o QR para você escanear com o WhatsApp.

```mermaid
graph TD
  A["Página Inicial do App"] --> B["Página Conexão"]
  B --> C["Enviar formulário (POST n8n)"]
  C --> D["Exibir