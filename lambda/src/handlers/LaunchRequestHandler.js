const Alexa = require('ask-sdk-core');

/**
 * Launch Request Handler
 * Handles the initial skill launch
 */
class LaunchRequestHandler {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    }

    handle(handlerInput) {
        const speakOutput = 'Bem-vindo, senhor! Em que posso ajudar?';
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Estou à disposição, senhor.')
            .getResponse();
    }
}

module.exports = LaunchRequestHandler;
