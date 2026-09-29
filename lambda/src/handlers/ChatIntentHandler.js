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
        const userMessage = Alexa.getSlotValue(handlerInput.requestEnvelope, 'message');
        
        // Get existing conversation history
        const conversationHistory = sessionAttributes[CONVERSATION_HISTORY_KEY] || [];

        if (!userMessage) {
            return handlerInput.responseBuilder
                .speak('Não entendi a pergunta. Pode repetir?')
                .reprompt('O que você quer saber?')
                .getResponse();
        }
        
        try {
            // Process message through conversation service
            const result = await this.conversationService.processMessage(userMessage, conversationHistory);
            
            // Save updated conversation history
            sessionAttributes[CONVERSATION_HISTORY_KEY] = result.conversationHistory;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            
            return handlerInput.responseBuilder
                .speak(escapeSsml(result.response))
                .reprompt('Quer perguntar mais alguma coisa?')
                .getResponse();
                
        } catch (error) {
            console.error('ChatIntent Error:', error.message, error.stack);
            const errorMessage = 'Desculpe, a inteligência artificial demorou ou falhou ao responder. Tente de novo.';
            
            return handlerInput.responseBuilder
                .speak(errorMessage)
                .reprompt('Quer tentar outra pergunta?')
                .getResponse();
        }
    }
}

module.exports = ChatIntentHandler;
