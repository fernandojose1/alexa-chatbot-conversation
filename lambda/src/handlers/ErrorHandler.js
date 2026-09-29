/**
 * Error Handler
 * Handles all errors gracefully
 */
class ErrorHandler {
    canHandle() {
        return true;
    }

    handle(handlerInput, error) {
        console.error(`Error handled: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
        
        const speakOutput = 'Perdão, senhor, tive um problema nos meus sistemas. Pode tentar de novo?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Pode tentar de novo, senhor?')
            .getResponse();
    }
}

module.exports = ErrorHandler;
