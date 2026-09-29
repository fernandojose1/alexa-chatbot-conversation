/**
 * Configuração da skill.
 *
 * Alexa-hosted não permite definir variáveis de ambiente, então os valores
 * ficam aqui (o repositório da skill Alexa-hosted é privado). Variáveis de
 * ambiente, se existirem, têm precedência.
 *
 * Provedor padrão: Groq (plano gratuito, modelos open source, API compatível
 * com a OpenAI). Chave em https://console.groq.com/keys
 */
module.exports = {
    apiKey: process.env.LLM_API_KEY || 'COLE_SUA_CHAVE_GROQ_AQUI',
    baseURL: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
    // Alternativa mais precisa, porém com respostas mais longas: 'openai/gpt-oss-120b'
    model: process.env.LLM_MODEL || 'qwen/qwen3.8-27b',
    // Modelos com busca na internet (cada um tem sua própria cota grátis; usa o próximo se estourar)
    // O 20b pesquisa mais rápido (~3-4s); o 120b fica de reserva
    searchModels: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'],
    timeZone: 'America/Sao_Paulo',
    maxTokens: parseInt(process.env.MAX_TOKENS) || 300,
    temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
    // A Alexa encerra a requisição em ~8s; resposta precisa sair antes disso
    timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS) || 7000,
    systemPrompt: 'Você é o J.A.R.V.I.S., a inteligência artificial criada por Tony Stark, agora servindo o '
        + 'usuário pela Alexa, em português do Brasil. Trate o usuário sempre por "senhor". Seja educado, '
        + 'calmo e eficiente, com o humor seco e sutil de um mordomo britânico. De vez em quando, sem exagerar, '
        + 'faça uma referência leve ao universo do Homem de Ferro (a armadura, a oficina, as Indústrias Stark). '
        + 'Responda de forma natural e curta (no máximo 3 frases), como numa conversa falada. '
        + 'Não use markdown, listas, emojis, tabelas nem links.'
};
