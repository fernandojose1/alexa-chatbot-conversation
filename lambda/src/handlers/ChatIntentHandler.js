const Alexa = require('ask-sdk-core');

const CONVERSATION_HISTORY_KEY = 'conversationHistory';

/**
 * Escape characters that would break the SSML wrapper Alexa builds around speech
 */
function escapeSsml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Chat Intent Handler
 * Handles user chat messages and integrates with ChatGPT
 */
class ChatIntentHandler {
    /**
     * @param {ConversationService} conversationService - Injected conversation service
     */
    constructor(conversationService) {
        this.conversationService = conversationService;
    }

    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ChatIntent';
    }

    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        // "message" vem das frases com abertura ("me diga ..."); "texto" é a frase livre inteira
        const userMessage = Alexa.getSlotValue(handlerInput.requestEnvelope, 'message')
            || Alexa.getSlotValue(handlerInput.requestEnvelope, 'texto');
        
        // Get existing conversation history
        const conversationHistory = sessionAttributes[CONVERSATION_HISTORY_KEY] || [];

        if (!userMessage) {
            return handlerInput.responseBuilder
                .speak('Perdão, senhor, não compreendi. Pode repetir?')
                .reprompt('O que deseja, senhor?')
                .getResponse();
        }
        
        try {
            // Process message through conversation service
            const result = await this.conversationService.processMessage(userMessage, conversationHistory, {
                onSearch: () => this.sayWhileSearching(handlerInput)
            });
            
            // Save updated conversation history
            sessionAttributes[CONVERSATION_HISTORY_KEY] = result.conversationHistory;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            
            return handlerInput.responseBuilder
                .speak(escapeSsml(result.response || 'Perdão, senhor, não encontrei nada sobre isso. Pode perguntar de outra forma?'))
                .reprompt('Algo mais, senhor?')
                .getResponse();
                
        } catch (error) {
            console.error('ChatIntent Error:', error.message, error.stack);
            const timedOut = error.constructor?.name === 'APIConnectionTimeoutError' || /timed out/i.test(error.message);
            const errorMessage = timedOut
                ? 'Perdão, senhor, a pesquisa demorou mais que o aceitável. Pode perguntar de novo?'
                : 'Perdão, senhor, tive uma falha nos meus sistemas. Pode tentar de novo?';
            
            return handlerInput.responseBuilder
                .speak(errorMessage)
                .reprompt('Deseja tentar outra pergunta, senhor?')
                .getResponse();
        }
    }

    /**
     * Progressive response: speaks while the web search runs, so the user isn't left in silence
     */
    async sayWhileSearching(handlerInput) {
        try {
            const directiveClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();
            await directiveClient.enqueue({
                header: { requestId: handlerInput.requestEnvelope.request.requestId },
                directive: { type: 'VoicePlayer.Speak', speech: 'Um momento, senhor. Consultando a internet.' }
            });
        } catch (error) {
            // Not critical: the answer still comes, just without the heads-up
            console.warn('Progressive response failed:', error.message);
        }
    }
}

module.exports = ChatIntentHandler;
