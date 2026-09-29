/**
 * OpenAI Repository
 * Handles all interactions with the OpenAI API using repository pattern
 */
class OpenAIRepository {
    /**
     * @param {Object} openaiClient - OpenAI-compatible client instance (injected dependency)
     * @param {Object} defaults - Default options (model, max_tokens, temperature)
     */
    constructor(openaiClient, defaults = {}) {
        this.client = openaiClient;
        this.defaults = defaults;
    }

    /**
     * Generate a chat completion based on conversation history
     * @param {Array} messages - Array of message objects with role and content
     * @param {Object} options - Configuration options (model, max_tokens, temperature)
     * @returns {Promise<string>} - The assistant's response
     */
    async getChatCompletion(messages, options = {}) {
        const {
            model = this.defaults.model || 'qwen/qwen3.8-27b',
            max_tokens = this.defaults.max_tokens || 300,
            temperature = this.defaults.temperature ?? 0.7
        } = options;

        console.log('OpenAI API Call:', {
            model,
            messageCount: messages.length,
            max_tokens,
            temperature
        });

        const completion = await this.client.chat.completions.create({
            model,
            messages,
            max_tokens,
            temperature
        });

        console.log('OpenAI Response:', {
            id: completion.id,
            model: completion.model,
            promptTokens: completion.usage?.prompt_tokens,
            completionTokens: completion.usage?.completion_tokens,
            totalTokens: completion.usage?.total_tokens
        });

        return completion.choices[0].message.content;
    }
}

module.exports = OpenAIRepository;
