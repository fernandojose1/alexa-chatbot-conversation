/**
 * OpenAI Repository
 * Handles all interactions with the OpenAI-compatible API (Groq) using repository pattern
 */
class OpenAIRepository {
    /**
     * @param {Object} openaiClient - OpenAI-compatible client instance (injected dependency)
     * @param {Object} defaults - Default options (model, max_tokens, temperature, searchModels)
     */
    constructor(openaiClient, defaults = {}) {
        this.client = openaiClient;
        this.defaults = defaults;
    }

    /**
     * Generate a chat completion, optionally offering function tools to the model
     * @param {Array} messages - Array of message objects with role and content
     * @param {Object} options - model, max_tokens, temperature, tools, toolChoice, timeout (ms)
     * @returns {Promise<{content: string|null, toolCall: {name: string, args: Object}|null}>}
     */
    async getChatCompletion(messages, options = {}) {
        const {
            model = this.defaults.model || 'qwen/qwen3.8-27b',
            max_tokens = this.defaults.max_tokens || 300,
            temperature = this.defaults.temperature ?? 0.7,
            tools,
            toolChoice = 'auto',
            timeout
        } = options;

        const body = { model, messages, max_tokens, temperature };
        if (tools) {
            body.tools = tools;
            body.tool_choice = toolChoice;
        }

        const completion = await this.create(body, timeout);
        const message = completion.choices[0].message;
        const call = message.tool_calls?.[0];

        return {
            content: message.content,
            toolCall: call ? { name: call.function.name, args: this.parseArgs(call.function.arguments) } : null
        };
    }

    /**
     * Answer using a model with Groq's built-in web search, falling back to the
     * next search model when one hits its rate limit (each model has its own quota)
     * @param {Array} messages - Array of message objects with role and content
     * @param {Object} options - timeout (ms)
     * @returns {Promise<string>} - The assistant's response
     */
    async searchCompletion(messages, options = {}) {
        const models = this.defaults.searchModels || ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];
        let lastError;

        for (const model of models) {
            try {
                const completion = await this.create({
                    model,
                    messages,
                    max_tokens: 2000,
                    tools: [{ type: 'browser_search' }],
                    tool_choice: 'auto',
                    reasoning_effort: 'low'
                }, options.timeout);
                const content = completion.choices[0].message.content;
                if (content && content.trim()) return content;
                lastError = new Error(`Search model ${model} returned an empty answer`);
                console.warn(lastError.message);
            } catch (error) {
                lastError = error;
                if (error.status !== 429) throw error;
                console.warn(`Search model ${model} rate limited, trying next`);
            }
        }
        throw lastError;
    }

    async create(body, timeout) {
        console.log('OpenAI API Call:', {
            model: body.model,
            messageCount: body.messages.length,
            tools: body.tools?.map(t => t.function?.name || t.type)
        });

        const completion = await this.client.chat.completions.create(body, timeout ? { timeout } : undefined);

        console.log('OpenAI Response:', {
            id: completion.id,
            model: completion.model,
            totalTokens: completion.usage?.total_tokens
        });

        return completion;
    }

    parseArgs(raw) {
        try {
            return JSON.parse(raw || '{}');
        } catch {
            return {};
        }
    }
}

module.exports = OpenAIRepository;
