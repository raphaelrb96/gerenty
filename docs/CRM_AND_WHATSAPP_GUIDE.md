# Guia Técnico: CRM, Integração WhatsApp e Automações no Gerenty

Este documento detalha a arquitetura, o fluxo de dados e os principais diretórios das funcionalidades de CRM, da integração com a API do WhatsApp e do construtor de fluxos de automação no sistema Gerenty.

---

## **Visão Geral da Interação**

O CRM, a Integração com o WhatsApp e as Automações são projetados para funcionar em conjunto. O objetivo é transformar cada conversa do WhatsApp em uma oportunidade de negócio gerenciável e automatizada.

-   **Recebimento:** Quando uma mensagem chega via WhatsApp, o sistema automaticamente busca ou cria um **Cliente** no CRM e inicia a verificação de **Automações**.
-   **Gerenciamento:** Uma **Conversa** é criada e vinculada a esse cliente, aparecendo no Inbox.
-   **Execução de Fluxo:** Se a mensagem do cliente aciona um gatilho (como uma palavra-chave), um fluxo de conversa automatizado é iniciado para interagir com ele.
-   **Contexto:** Ao visualizar a conversa no Inbox, o usuário tem acesso rápido aos dados do cliente no CRM, seu estágio no funil e o histórico da conversa, incluindo as interações automáticas.

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

-   **/src/services/customer-service.ts**: Contém toda a lógica de front-end para interagir com a coleção `customers` no Firestore. Inclui funções para criar, ler, atualizar e deletar clientes (`CRUD`).

-   **/src/services/stage-service.ts**: Contém a lógica de front-end para gerenciar os estágios do funil, interagindo com a coleção `stages` no Firestore.

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

---

## **Módulo de Automação de Conversas (Flow Builder)**

Esta funcionalidade permite a criação de fluxos de conversa automatizados para o WhatsApp, permitindo que o sistema responda a clientes, capture informações e execute ações sem intervenção humana.

### **1. Objetivo**

Automatizar o atendimento inicial, qualificar leads, responder a perguntas frequentes e guiar os clientes através de processos (como rastreamento de pedidos ou coleta de feedback) de forma visual e intuitiva.

### **2. Arquitetura e Conceitos**

O Flow Builder é construído sobre a integração com o WhatsApp e utiliza a mesma infraestrutura de Cloud Functions para sua execução.

*   **Fluxo (Flow):** Um fluxograma visual composto por **Nós (Nodes)** e **Conexões (Edges)**. Cada fluxo representa uma conversa automatizada.
*   **Nós (Nodes):** Representam as ações ou "tarefas" que o robô executa. Exemplos:
    *   **Gatilho de Palavra-Chave:** Inicia o fluxo se a mensagem do cliente corresponde a uma palavra (ex: "cardápio").
    *   **Enviar Mensagem:** Envia uma resposta pré-definida da **Biblioteca de Respostas**.
    *   **Capturar Dados:** Faz uma pergunta e salva a resposta do cliente (ex: "Qual o seu CPF?").
    *   **Condição Lógica:** Cria ramificações no fluxo (ex: se a resposta do cliente contém "sim", siga por um caminho; senão, por outro).
*   **Biblioteca de Respostas:** Um repositório de mensagens prontas (texto, imagens, botões, etc.) que podem ser reutilizadas em diferentes fluxos.

### **3. Estrutura de Diretórios Relevante**

*   **/src/app/dashboard/automation/flows/edit/[id]/page.tsx**: A interface principal do Flow Builder, onde o usuário constrói visualmente o fluxograma. Utiliza a biblioteca `ReactFlow`.
*   **/src/components/automation/**: Contém os componentes da interface do construtor:
    *   `flow-builder.tsx`: O componente principal que renderiza a área de arrastar e soltar.
    *   `custom-node.tsx`: Define a aparência e o comportamento de cada tipo de nó no fluxograma.
    *   `node-config-panel.tsx`: O painel lateral que aparece quando um nó é selecionado, permitindo a sua configuração.
*   **/src/services/flow-service.ts**: Lógica de front-end para salvar, carregar e atualizar as definições dos fluxos no Firestore, na coleção `/flows`.
*   **/src/services/library-message-service.ts**: Gerencia o CRUD (Criar, Ler, Atualizar, Deletar) das respostas rápidas salvas na coleção `/libraryMessages` de uma empresa.
*   **/functions/src/functions/whatsapp.ts**: **O motor de execução dos fluxos.** A função `processIncomingMessage` foi expandida para:
    1.  Verificar se a mensagem recebida aciona algum fluxo publicado.
    2.  Se sim, ela atualiza o documento da `/conversations` com o `activeFlowId` e o passo atual.
    3.  Chama a função `processFlowStep`, que executa a lógica do nó atual e determina o próximo passo.

### **4. Fluxo de Execução de uma Automação**

1.  Uma mensagem do WhatsApp chega ao `whatsappWebhookListener`.
2.  `processIncomingMessage` é chamada. Ela primeiro verifica se já existe um fluxo ativo para aquela conversa.
3.  **Se não há fluxo ativo**, ela verifica se a mensagem do usuário (ex: "quero o cardápio") corresponde a um `keywordTrigger` de algum fluxo publicado.
4.  **Se um gatilho é encontrado**, o sistema armazena o `activeFlowId` e o `currentStepId` (o ID do nó de gatilho) no documento da conversa no Firestore.
5.  A função `processFlowStep` é invocada. Ela lê o nó atual, executa sua ação (ex: `message` -> envia uma mensagem da biblioteca; `captureData` -> envia uma pergunta) e segue as conexões (edges) para encontrar o próximo nó.
6.  O processo se repete, com o `currentStepId` na conversa sendo atualizado a cada passo, até que o fluxo chegue a um nó de "Finalizar Fluxo" ou um ponto de espera por uma nova resposta do usuário.
