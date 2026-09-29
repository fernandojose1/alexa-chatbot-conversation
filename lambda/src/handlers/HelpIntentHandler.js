const Alexa = require('ask-sdk-core');

/**
 * Help Intent Handler
 * Provides help information to the user
 */
class HelpIntentHandler {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    }

    handle(handlerInput) {
        const speakOutput = 'Pode me perguntar qualquer coisa, senhor: previsão do tempo, notícias, resultados de jogos, cotações, ou apenas conversar. Eu pesquiso na internet quando necessário. O que deseja?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('O que deseja, senhor?')
            .getResponse();
    }
}

module.exports = HelpIntentHandler;
