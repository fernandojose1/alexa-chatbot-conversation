/**
 * Conversa com o Jarvis pelo terminal, passando pelos mesmos handlers da Alexa.
 * Uso: LLM_API_KEY=gsk_... npm run conversar
 */
const readline = require('readline');
const Alexa = require('ask-sdk-core');
const DependencyContainer = require('../lambda/src/DependencyContainer');

if (!process.env.LLM_API_KEY) {
    console.error('Defina a chave: LLM_API_KEY=gsk_... npm run conversar (grátis em https://console.groq.com/keys)');
    process.exit(1);
}

const container = new DependencyContainer();
const handlers = container.getRequestHandlers();

// Fora da Alexa não há o "deixa eu pesquisar" (resposta progressiva); mostramos no terminal
handlers.find(h => h.sayWhileSearching).sayWhileSearching = async () => console.log('Jarvis: (Um momento, senhor. Consultando a internet.)');

const skill = Alexa.SkillBuilders.custom()
    .addRequestHandlers(...handlers)
    .addErrorHandlers(...container.getErrorHandlers())
    .create();

// Esconde os logs técnicos das chamadas à API
const log = console.log;
console.log = (...args) => { if (!String(args[0]).startsWith('OpenAI')) log(...args); };

let attributes = {};

function request(texto) {
    return {
        version: '1.0',
        session: { new: false, sessionId: 'terminal', application: { applicationId: 'terminal' }, attributes, user: { userId: 'terminal' } },
        context: { System: { application: { applicationId: 'terminal' }, user: { userId: 'terminal' }, device: { supportedInterfaces: {} } } },
        request: {
            type: 'IntentRequest', requestId: 'terminal', locale: 'pt-BR', timestamp: new Date().toISOString(),
            intent: { name: 'ChatIntent', confirmationStatus: 'NONE', slots: { texto: { name: 'texto', value: texto } } }
        }
    };
}

const speech = (ssml) => ssml.replace(/<\/?speak>/g, '')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'Você: ' });
console.log('Converse com o Jarvis (Ctrl+C para sair).');
rl.prompt();
// Uma pergunta por vez, na ordem, mesmo com texto colado ou vindo de um pipe
let fila = Promise.resolve();
rl.on('line', (line) => {
    fila = fila.then(async () => {
        if (line.trim()) {
            const response = await skill.invoke(request(line.trim()));
            attributes = response.sessionAttributes || attributes;
            console.log(`Jarvis: ${speech(response.response.outputSpeech.ssml)}`);
        }
        rl.prompt();
    });
});
rl.on('close', () => fila.then(() => process.exit(0)));
