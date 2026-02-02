# Guia Técnico: CRM e Integração WhatsApp no Gerenty

Este documento detalha a arquitetura, o fluxo de dados e os principais diretórios das funcionalidades de CRM e da integração com a API do WhatsApp no sistema Gerenty.

---

## **Visão Geral da Interação**

O CRM e a Integração com o WhatsApp são projetados para funcionar em conjunto. O objetivo é transformar cada conversa do WhatsApp em uma oportunidade de negócio gerenciável.

-   **Recebimento:** Quando uma mensagem chega via WhatsApp, o sistema automaticamente busca ou cria um **Cliente** no CRM.
-   **Gerenciamento:** Uma **Conversa** é criada e vinculada a esse cliente, aparecendo no Inbox.
-   **Contexto:** Ao visualizar a conversa no Inbox, o usuário tem acesso rápido aos dados do cliente no CRM, seu estágio no funil de vendas e seu histórico.

---

## **Módulo de CRM**

O CRM é construído em torno de dois conceitos principais: **Clientes (Customers)** e **Estágios (Stages)**.

### **1. Objetivo**

Organizar e gerenciar o ciclo de vida dos clientes, desde leads até clientes fidelizados, através de um funil de vendas visual e interativo (Kanban).

### **2. Estrutura de Dados**

A lógica de dados do CRM está definida principalmente nos seguintes tipos:

-   `Customer` (`/src/lib/types.ts`): Representa um cliente. Contém informações de contato, tags, e o `status`, que é o ID do estágio atual em que ele se encontra.
-   `Stage` (`/src/lib/types.ts`): Representa uma coluna no funil do CRM (ex: "Lead", "Contato", "Ativo"). Contém um nome e uma ordem de exibição.

### **3. Estrutura de Diretórios Relevante**

-   **/src/app/dashboard/crm/page.tsx**: É a página principal do CRM. Ela renderiza o quadro Kanban, busca os dados iniciais e gerencia os estados de arrastar e soltar (Drag and Drop).

-   **/src/services/customer-service.ts**: Contém toda a lógica de back-end para interagir com a coleção `customers` no Firestore. Inclui funções para criar, ler, atualizar e deletar clientes (`CRUD`).

-   **/src/services/stage-service.ts**: Contém a lógica de back-end para gerenciar os estágios do funil, interagindo com a coleção `stages` no Firestore.

-   **/src/components/crm/**: Este diretório abriga todos os componentes de interface do CRM:
    -   `customer-list.tsx`: Renderiza a lista de clientes dentro de uma coluna.
    -   `customer-card.tsx`: O card individual de cada cliente, que é o item arrastável.
    -   `stage-menu.tsx`: A coluna lateral que exibe os estágios e permite a navegação.
    -   `create-customer-modal.tsx`: O formulário para adicionar ou editar um cliente.

### **4. Funcionalidades Chave**

-   **Visualização Kanban:** Os clientes são exibidos em colunas que representam cada estágio do funil.
-   **Arrastar e Soltar (Drag and Drop):** Permite mover um cliente de um estágio para outro simplesmente arrastando seu card. Ao soltar, o status do cliente é atualizado automaticamente no banco de dados.
-   **Gerenciamento de Estágios:** É possível criar, renomear, reordenar e excluir os estágios do funil.
-   **Detalhes do Cliente:** Um modal exibe informações detalhadas do cliente, incluindo seu histórico de compras.

---

## **Integração com WhatsApp**

A integração é dividida entre o **front-end** (configuração) e o **back-end** (Firebase Cloud Functions), que lida com a comunicação real com a API da Meta.

### **1. Objetivo**

Automatizar a comunicação com clientes via WhatsApp, permitindo o envio e recebimento de mensagens diretamente pela plataforma Gerenty e o uso de automações.

### **2. Arquitetura**

O sistema utiliza Firebase Cloud Functions como um intermediário seguro entre o Gerenty e a API da Meta. Isso evita expor chaves de API no lado do cliente e resolve problemas de CORS.

-   **Fluxo de Recebimento (Inbound):** `Meta Webhook` -> `Cloud Function (whatsappWebhookListener)` -> `processIncomingMessage` -> `Firestore (cria/atualiza Cliente e Conversa)`
-   **Fluxo de Envio (Outbound):** `UI do Gerenty` -> `integration-service.ts` -> `Cloud Function (sendMessage)` -> `whatsAppService.ts` -> `Meta Graph API`

### **3. Estrutura de Diretórios Relevante**

-   **/src/app/dashboard/integrations/whatsapp/page.tsx**: Interface para o usuário inserir e gerenciar as credenciais da API do WhatsApp.

-   **/src/services/integration-service.ts**: Funções de front-end que fazem a ponte com as Cloud Functions, como `saveWhatsAppCredentials` e `sendMessage`.

-   **/functions/src/functions/whatsapp.ts**: **O coração da integração.** Contém as Cloud Functions que são os endpoints reais da nossa lógica:
    -   `validateAndSaveCredentials`: Valida e salva as credenciais da API.
    -   `whatsappWebhookListener`: O endpoint público que a Meta chama para notificar sobre novas mensagens e eventos.
    -   `sendMessage`: Função chamada pelo front-end para disparar o envio de uma mensagem.
    -   `apiSyncWhatsAppTemplates`: Sincroniza os modelos de mensagem da Meta com o Firestore.

-   **/functions/src/services/whatsAppService.ts**: Camada de serviço no back-end que lida diretamente com as chamadas `fetch` (usando `axios`) para a API da Meta (ex: `https://graph.facebook.com/...`).

-   **/functions/src/services/template-service.ts**: Gerencia a lógica de templates de mensagem, tanto no Firestore quanto na API da Meta.

### **4. Conexão entre WhatsApp e CRM**

A mágica acontece na função `processIncomingMessage` dentro de `/functions/src/functions/whatsapp.ts`:

1.  Quando o `whatsappWebhookListener` recebe uma nova mensagem, ele chama essa função.
2.  A função extrai o número de telefone do remetente.
3.  Ela então faz uma busca na coleção `/customers` para ver se já existe um cliente com aquele número de telefone.
4.  **Se o cliente não existe**, um novo cliente é criado no CRM, geralmente no primeiro estágio do funil (ex: "Lead").
5.  Com o ID do cliente em mãos, o sistema busca uma conversa (`/conversations`) ativa para ele. Se não houver, uma nova é criada.
6.  Finalmente, a nova mensagem é salva como um subdocumento dentro da conversa correspondente.

Esse processo garante que toda interação via WhatsApp seja automaticamente registrada e associada a um perfil de cliente no CRM.
