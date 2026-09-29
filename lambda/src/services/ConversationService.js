/**
 * Conversation Service
 * Manages conversation history and context
 */
class ConversationService {
    constructor(openAIRepository, systemPrompt = null) {
        this.openAIRepository = openAIRepository;
        this.systemPrompt = systemPrompt;
        this.maxHistoryLength = 10;
    }

    /**
     * Process a user message and get a response
     * @param {string} userMessage - The user's message
     * @param {Array} conversationHistory - Existing conversation history
     * @returns {Promise<Object>} - Object with response and updated history
     */
    async processMessage(userMessage, conversationHistory = []) {
        // Add user message to history
        const updatedHistory = [...conversationHistory, {
            role: 'user',
            content: userMessage
        }];

        try {
            // Get response from OpenAI
            // System prompt is sent on every call but not stored in session history
            const messages = this.systemPrompt
                ? [{ role: 'system', content: this.systemPrompt }, ...updatedHistory]
                : updatedHistory;
            const assistantMessage = await this.openAIRepository.getChatCompletion(messages);

            // Add assistant response to history
            updatedHistory.push({
                role: 'assistant',
                content: assistantMessage
            });

            // Trim history to maintain max length
            const trimmedHistory = this.trimHistory(updatedHistory);

            return {
                response: assistantMessage,
                conversationHistory: trimmedHistory
            };
        } catch (error) {
            console.error('Error processing message:', error);
            throw error;
        }
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
