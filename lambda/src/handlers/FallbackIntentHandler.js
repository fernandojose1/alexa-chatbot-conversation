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
        const speakOutput = 'Não entendi. Tente começar com: me diga, o que é, ou me explica. O que você quer saber?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('O que você quer perguntar?')
            .getResponse();
    }
}

module.exports = FallbackIntentHandler;
