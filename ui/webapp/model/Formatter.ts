
import BaseObject from "sap/ui/base/Object";
import BaseController from "sci/ams/express/controller/BaseController";

/**
 * @namespace sci.ams.express.model
 */
export default class Formatter extends BaseObject {
    public static getFormattedText(this: BaseController, text: string) {
        return text;
    }
}