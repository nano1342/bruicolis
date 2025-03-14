import * as Errors from "../Utils/Errors";

export class ResponseBody {
    
    status: string;
    message: string;
    returnObject: object | undefined;
    error: object | undefined;

    private constructor(status: string, message: string, returnObject: object | undefined, error: object | undefined) {
        this.status = status;
        this.message = message;
        this.returnObject = returnObject;
        this.error = error;
    }

    public static getResponseBodyOk(message: string) {
        return new ResponseBody('success', message, undefined, undefined);
    }

    public static getResponseBodyOkWithObject(message: string, object: object) {
        return new ResponseBody('success', message, object, undefined);
    }

    public static getResponseBodyFail(message: string, error: object) {
        return new ResponseBody('fail', message, undefined, error);
    }

    public static getResponseBodyFailDefault() {
        return new ResponseBody('fail', "Something went wrong", undefined, Errors.getErrorBodyDefault(Errors.ErrorType.SERVER_ERROR));
    }

}