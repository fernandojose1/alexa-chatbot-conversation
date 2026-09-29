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
        const speakOutput = 'Oi! Pode perguntar.';
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Pode perguntar. Por exemplo: me conta uma piada.')
            .getResponse();
    }
}

module.exports = LaunchRequestHandler;
