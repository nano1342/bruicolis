"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorType = exports.IncorrectParameterError = void 0;
exports.getErrorBody = getErrorBody;
exports.getDefaultMessage = getDefaultMessage;
exports.getErrorBodyDefault = getErrorBodyDefault;
function getErrorBody(errorType, message) {
    return {
        error: {
            type: errorType,
            message: message
        }
    };
}
function getErrorBodyDefault(errorType) {
    return {
        error: {
            type: errorType,
            message: getDefaultMessage(errorType)
        }
    };
}
var ErrorType;
(function (ErrorType) {
    ErrorType["WRONG_BODY"] = "Wrong body";
    ErrorType["MISSING_PARAMETER"] = "Missing parameter";
    ErrorType["INCORRECT_PARAMETER"] = "Incorrect parameter";
    ErrorType["MISSING_BODY_PARAMETER"] = "Missing body parameter";
    ErrorType["INCORRECT_BODY_PARAMETER"] = "Incorrect body parameter";
    ErrorType["NOT_FOUND"] = "Not found";
    ErrorType["FOREIGN_KEY_NOT_FOUND"] = "Foreign key not found";
    ErrorType["SERVER_ERROR"] = "Server error";
    ErrorType["DEFAULT"] = "Default";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
const defaultMessages = new Map([
    [ErrorType.WRONG_BODY, "The request body format is incorrect."],
    [ErrorType.MISSING_PARAMETER, "There is a missing request parameter."],
    [ErrorType.INCORRECT_PARAMETER, "A parameter is incorrect."],
    [ErrorType.NOT_FOUND, "Ressource not found"],
    [ErrorType.DEFAULT, "Something went wrong."],
]);
function getDefaultMessage(errorType) {
    return defaultMessages.get(errorType);
}
class IncorrectParameterError extends Error {
}
exports.IncorrectParameterError = IncorrectParameterError;
