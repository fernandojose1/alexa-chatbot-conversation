# J.A.R.V.I.S. para Alexa

Uma skill da Alexa em português que transforma o seu Echo no **J.A.R.V.I.S.**, o assistente do Homem de Ferro, usando **inteligência artificial open source e gratuita**. Ele conversa sobre qualquer assunto, lembra do que foi dito na conversa e **pesquisa na internet** quando a pergunta depende de informação atual: clima, notícias, resultados de jogos, cotações etc.

```
Você:    Alexa, abrir jarvis assistente
Jarvis:  Bem-vindo, senhor! Em que posso ajudar?
Você:    Vai chover amanhã em São Paulo?
Jarvis:  Um momento, senhor. Consultando a internet.
Jarvis:  Senhor, a previsão para amanhã indica pancadas de chuva à tarde, com máxima de 33 graus.
Você:    E no Rio?
Jarvis:  No Rio, senhor, sol com algumas nuvens e pancadas no início do dia.
Você:    Me conta uma piada
Jarvis:  Senhor, meu humor é tão afiado quanto a armadura Mark I...
```

**Custo: zero.** A skill roda no **Alexa-hosted**, que a Amazon hospeda de graça, e a IA roda no **[Groq](https://groq.com)**, com plano gratuito e sem cartão de crédito. Você não precisa de conta na AWS nem na OpenAI.

## Como funciona

```
Echo / Alexa
   ↓ o que você falou (qualquer frase)
Skill Alexa-hosted (Node.js, lambda/)
   ↓
Qwen 3.8 27B (Groq) ── responde direto, em ~0,5 s
   │
   └─ precisa de informação atual? chama a ferramenta "buscar_na_internet"
         ↓  (a Alexa fala "Um momento, senhor. Consultando a internet.")
      GPT-OSS 20B com busca na web (Groq), com reserva no GPT-OSS 120B
         ↓
Alexa fala a resposta
```

- **Data e hora de Brasília** vão em toda pergunta, então ele sabe o que é "hoje" e "amanhã".
- **Continuações** como "e no Rio?" ou "e amanhã?", depois de uma pesquisa, sempre disparam uma pesquisa nova. Assim ele não reaproveita os dados da resposta anterior.
- **Histórico:** ele lembra as últimas 10 mensagens da conversa, enquanto a skill estiver aberta.
- **Limpeza da resposta:** citações, markdown e links são removidos antes de a Alexa falar.

## Instalação na sua Alexa (15 minutos, sem terminal)

### 1. Chave grátis do Groq
1. Entre em https://console.groq.com e faça login com Google ou GitHub.
2. Em **API Keys → Create API Key**, copie a chave (`gsk_...`). Guarde, porque ela só aparece uma vez.

### 2. Baixar o código
Baixe este repositório (**Code → Download ZIP**) ou clone com `git clone`. Você vai usar dois arquivos dele:
- `skill-package/interactionModels/custom/pt-BR.json`: o modelo de voz.
- O zip do código. Gere com `npm run build:hosted` (cria `dist/lambda-alexa-hosted.zip`) ou compacte a pasta `lambda/` inteira num zip. A pasta `lambda/` precisa estar na raiz do zip.

### 3. Criar a skill
1. Entre em https://developer.amazon.com/alexa/console/ask com a **mesma conta Amazon da sua Alexa**.
2. Clique em **Create Skill** e preencha:
   - **Name:** `Jarvis Assistente` · **Primary locale:** `Portuguese (BR)`
   - **Type of experience:** Other · **Model:** Custom
   - **Hosting service:** **Alexa-hosted (Node.js)** · **Region:** US East (N. Virginia)
   - **Template:** Start from Scratch
3. Clique em **Create skill** e espere 1 a 2 minutos.

> ⚠️ Não use o botão **Import skill**. Ele só aceita repositórios públicos e não configura a chave.

### 4. Modelo de voz
1. Vá em **Build → Interaction Model → JSON Editor**.
2. Arraste o arquivo `pt-BR.json` para o editor ou cole o conteúdo dele, substituindo tudo.
3. Clique em **Save** e depois em **Build skill**. Leva cerca de 1 minuto.

### 5. Código
1. Na aba **Code**, clique em **Import Code** e escolha o zip do passo 2. Confirme a substituição dos arquivos.
2. Abra `lambda/config.js` no editor do console e troque `COLE_SUA_CHAVE_GROQ_AQUI` pela sua chave.
3. Clique em **Save** e depois em **Deploy**. Espere o "Deployment successful".

> 🔒 A chave vai **somente** no editor do console da Alexa, que fica num repositório privado da Amazon. Nunca faça commit de `lambda/config.js` com a chave num repositório público.

### 6. Testar
1. Na aba **Test**, troque **Off** por **Development**.
2. Digite `abrir jarvis assistente` e depois `vai chover amanhã em São Paulo`.
3. Pronto: a skill já aparece em todos os Echos da sua conta. Diga "**Alexa, abrir jarvis assistente**".
   Se você mudou a palavra de ativação de um aparelho, use ela no lugar de "Alexa", por exemplo "Echo, abrir jarvis assistente".

Se algo falhar, veja os erros em **Code → CloudWatch Logs**.

## Testar no terminal (opcional)

Converse com o Jarvis no terminal, passando pelo mesmo código que roda na Alexa:

```bash
npm install
LLM_API_KEY=gsk_sua_chave npm run conversar
```

Para rodar os testes automatizados: `npm test`.

## Personalizar

Tudo fica em [`lambda/config.js`](lambda/config.js):

| Opção | Padrão | Para quê |
|---|---|---|
| `model` | `qwen/qwen3.8-27b` | Modelo que conversa e decide quando pesquisar |
| `searchModels` | `gpt-oss-20b`, `gpt-oss-120b` | Modelos com busca na web; se um estourar a cota, usa o próximo |
| `systemPrompt` | personalidade do J.A.R.V.I.S. | Personalidade e estilo das respostas |
| `timeoutMs` | `7000` | Tempo máximo para responder (a Alexa desiste em 8 s) |
| `baseURL` | Groq | Qualquer API compatível com a da OpenAI |

- **Falas fixas** (boas-vindas, despedida, ajuda, erros) ficam em [`lambda/src/handlers/`](lambda/src/handlers/).
- **Nome de invocação:** mude em `pt-BR.json` (`invocationName`) ou no console, em **Build → Invocations**. Ele precisa ter duas palavras ou mais e não pode conter palavras de ativação como "Alexa" ou "Echo".
- **Modelos:** veja os disponíveis em https://console.groq.com/docs/models. O catálogo muda com frequência.

## Limitações

- **Tempo:** a Alexa espera no máximo 8 segundos. Respostas diretas saem em menos de 1 s. As pesquisas levam de 3 a 7 s e, às vezes, estouram o tempo. Nesse caso o Jarvis pede para você perguntar de novo.
- **Cota grátis:** o Groq limita cada modelo a cerca de 8 mil tokens por minuto, e cada pesquisa gasta de 4 a 5 mil. Na prática dá umas 3 pesquisas por minuto, o que sobra para uso em casa.
- **Precisão:** as respostas vêm de IA e de pesquisa na web. Podem errar, então confira o que for importante.
- **Uso pessoal:** J.A.R.V.I.S. e Homem de Ferro são marcas da Marvel. Este é um projeto de fã, para usar em modo de desenvolvimento nos seus próprios dispositivos. A Amazon não aprovaria a publicação na loja de skills com esse nome e essa personalidade.

## Créditos

Fork de [crsiebler/alexa-chatbot-conversation](https://github.com/crsiebler/alexa-chatbot-conversation), que integrava a Alexa ao ChatGPT em inglês. Esta versão adiciona pt-BR, Alexa-hosted, IA gratuita no Groq, busca na internet e a personalidade do J.A.R.V.I.S.

Licença ISC, a mesma declarada no `package.json` do projeto original.
