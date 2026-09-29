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
    maxTokens: parseInt(process.env.MAX_TOKENS) || 300,
    temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
    // A Alexa encerra a requisição em ~8s; resposta precisa sair antes disso
    timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS) || 6500,
    systemPrompt: 'Você é o Jarvis, um assistente de voz falando pela Alexa, em português do Brasil. '
        + 'Responda de forma natural e curta (no máximo 3 frases), como numa conversa falada. '
        + 'Não use markdown, listas, emojis, tabelas nem links.'
};
