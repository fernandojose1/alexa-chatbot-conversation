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
        const speakOutput = 'Você pode me perguntar qualquer coisa começando com frases como: me diga, o que é, quem foi, como, ou me explica. Por exemplo: o que é um buraco negro? O que você quer saber?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('O que você quer perguntar?')
            .getResponse();
    }
}

module.exports = HelpIntentHandler;
