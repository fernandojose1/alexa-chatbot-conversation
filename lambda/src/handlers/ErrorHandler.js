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
        
        const speakOutput = 'Desculpe, tive um problema para fazer isso. Tente de novo.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Tente de novo.')
            .getResponse();
    }
}

module.exports = ErrorHandler;
