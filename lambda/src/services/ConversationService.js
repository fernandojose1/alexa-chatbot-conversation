const SEARCH_TOOL = {
    type: 'function',
    function: {
        name: 'buscar_na_internet',
        description: 'Pesquisa na internet. Use SOMENTE quando a resposta depende de informação atual ou recente '
            + 'que você não sabe com certeza: notícias, clima, cotações, resultados de jogos, eventos, preços, '
            + 'lançamentos, horários de funcionamento. Vale também para perguntas de continuação sobre esses '
            + 'assuntos (ex.: "e no Rio?", "e amanhã?"): cada lugar ou data diferente precisa de uma nova pesquisa. '
            + 'Nunca invente nem reaproveite dados atuais de outra resposta.',
        parameters: {
            type: 'object',
            properties: {
                consulta: { type: 'string', description: 'O que pesquisar, em português' }
            },
            required: ['consulta']
        }
    }
};

// "e no Rio?", "e amanhã?", "mas e em Curitiba?": continuação curta de uma pergunta anterior
const FOLLOW_UP = /^(mas )?e (no|na|nos|nas|em|de|do|da|pra|para|o|a|os|as|amanhã|hoje|ontem|agora|depois|quanto|qual|quem|onde|quando|se)\b/i;

const SEARCH_INSTRUCTIONS = 'Pesquise na internet para responder. Responda em no máximo 3 frases curtas, '
    + 'para serem faladas em voz alta: sem citações, fontes, links, markdown ou listas.';

/**
 * Conversation Service
 * Manages conversation history and context
 */
class ConversationService {
    /**
     * @param {OpenAIRepository} openAIRepository
     * @param {string|null} systemPrompt - Base instructions sent on every call
     * @param {Object} options - timeZone, budgetMs (total time available to answer), now (clock, for tests)
     */
    constructor(openAIRepository, systemPrompt = null, options = {}) {
        this.openAIRepository = openAIRepository;
        this.systemPrompt = systemPrompt;
        this.maxHistoryLength = 10;
        this.timeZone = options.timeZone || 'America/Sao_Paulo';
        this.budgetMs = options.budgetMs || 6500;
        this.now = options.now || (() => new Date());
    }

    /**
     * Process a user message and get a response
     * @param {string} userMessage - The user's message
     * @param {Array} conversationHistory - Existing conversation history
     * @param {Object} hooks - onSearch: called (and awaited) right before a web search starts
     * @returns {Promise<Object>} - Object with response, updated history and whether it searched
     */
    async processMessage(userMessage, conversationHistory = [], hooks = {}) {
        const deadline = Date.now() + this.budgetMs;
        const remaining = () => Math.max(deadline - Date.now(), 1000);

        // Add user message to history
        const updatedHistory = [...conversationHistory, {
            role: 'user',
            content: userMessage
        }];

        try {
            // System prompt is sent on every call but not stored in session history
            const messages = [{ role: 'system', content: this.buildSystemPrompt() }, ...this.toApiMessages(updatedHistory)];

            // The model often answers follow-ups of a searched topic by reusing the previous data,
            // so a follow-up right after a search always searches again
            const lastAnswer = conversationHistory[conversationHistory.length - 1];
            const mustSearch = Boolean(lastAnswer?.pesquisa) && FOLLOW_UP.test(userMessage.trim());

            const first = await this.openAIRepository.getChatCompletion(messages, {
                tools: [SEARCH_TOOL],
                toolChoice: mustSearch
                    ? { type: 'function', function: { name: SEARCH_TOOL.function.name } }
                    : 'auto',
                timeout: remaining()
            });

            let assistantMessage = first.content;
            let searched = false;
            let consulta;

            if (first.toolCall?.name === SEARCH_TOOL.function.name) {
                searched = true;
                if (hooks.onSearch) await hooks.onSearch();

                consulta = first.toolCall.args.consulta || userMessage;
                const searchMessages = [
                    { role: 'system', content: `${this.buildSystemPrompt()} ${SEARCH_INSTRUCTIONS}` },
                    // The search model only knows its own browser tool, so it gets plain text history
                    ...updatedHistory.slice(0, -1).map(({ role, content }) => ({ role, content })),
                    { role: 'user', content: `${userMessage} (pesquise por: ${consulta})` }
                ];
                assistantMessage = await this.openAIRepository.searchCompletion(searchMessages, {
                    timeout: remaining()
                });
            }

            assistantMessage = this.cleanForSpeech(assistantMessage);

            // Add assistant response to history
            // Answers from a search remember what was searched, so the model knows it didn't
            // know that by itself and a follow-up about another place/date needs a new search
            updatedHistory.push(searched
                ? { role: 'assistant', content: assistantMessage, pesquisa: consulta }
                : { role: 'assistant', content: assistantMessage });

            // Trim history to maintain max length
            const trimmedHistory = this.trimHistory(updatedHistory);

            return {
                response: assistantMessage,
                conversationHistory: trimmedHistory,
                searched
            };
        } catch (error) {
            console.error('Error processing message:', error);
            throw error;
        }
    }

    /**
     * Convert session history to API messages. An answer that came from a search is sent
     * in the native tool format (tool call -> tool result -> answer), so the model sees
     * that it used the tool for that kind of question instead of copying the data
     * @param {Array} history
     * @returns {Array}
     */
    toApiMessages(history) {
        return history.flatMap(({ role, content, pesquisa }, i) => {
            if (!pesquisa) return [{ role, content }];
            const id = `busca_${i}`;
            return [
                {
                    role: 'assistant',
                    content: null,
                    tool_calls: [{
                        id,
                        type: 'function',
                        function: { name: SEARCH_TOOL.function.name, arguments: JSON.stringify({ consulta: pesquisa }) }
                    }]
                },
                { role: 'tool', tool_call_id: id, content },
                { role, content }
            ];
        });
    }

    /**
     * Base prompt plus the current date and time, so the model knows "today"
     */
    buildSystemPrompt() {
        const agora = this.now().toLocaleString('pt-BR', {
            timeZone: this.timeZone,
            dateStyle: 'full',
            timeStyle: 'short'
        });
        const contexto = `Agora é ${agora} (horário de Brasília).`;
        return this.systemPrompt ? `${this.systemPrompt} ${contexto}` : contexto;
    }

    /**
     * Strip what shouldn't be read aloud: search citations, markdown and links
     * @param {string} text
     * @returns {string}
     */
    cleanForSpeech(text) {
        return String(text || '')
            .replace(/【[^】]*】/g, '')
            .replace(/^\s*\[[^\]]*\]\s*/, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[*_#`]+/g, '')
            .replace(/\s+([.,;:!?])/g, '$1')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Trim conversation history to max length
     * @param {Array} history - Conversation history
     * @returns {Array} - Trimmed history
     */
    trimHistory(history) {
        if (history.length > this.maxHistoryLength) {
            return history.slice(-this.maxHistoryLength);
        }
        return history;
    }
}

module.exports = ConversationService;
