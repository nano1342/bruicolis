function getErrorBody(errorType: ErrorType, message: string) {
    return {
        error: {
            type: errorType,
            message: message
        }
    };
}

function getErrorBodyDefault(errorType: ErrorType) {
    return {
        error: {
            type: errorType,
            message: getDefaultMessage(errorType)
        }
    };
}

enum ErrorType {
    WRONG_BODY = "Wrong body",
    MISSING_PARAMETER = "Missing parameter",
    INCORRECT_PARAMETER = "Incorrect parameter",
    DEFAULT = "Default"
}

const defaultMessages = new Map<ErrorType, string>([
    [ErrorType.WRONG_BODY, "The request body format is incorrect."],
    [ErrorType.MISSING_PARAMETER, "There is a missing request parameter."],
    [ErrorType.INCORRECT_PARAMETER, "A parameter is incorrect."],
    [ErrorType.DEFAULT, "Something went wrong."],
]);

function getDefaultMessage(errorType: ErrorType) {
    return defaultMessages.get(errorType);
}

export {
    getErrorBody,
    getDefaultMessage,
    getErrorBodyDefault,
    ErrorType,
}