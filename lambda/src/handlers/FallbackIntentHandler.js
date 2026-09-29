const Alexa = require('ask-sdk-core');

/**
 * Fallback Intent Handler
 * Handles unrecognized inputs
 */
class FallbackIntentHandler {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    }

    handle(handlerInput) {
        const speakOutput = 'Perdão, senhor, não compreendi. Pode dizer de outra forma?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('O que deseja, senhor?')
            .getResponse();
    }
}

module.exports = FallbackIntentHandler;
