import DatePicker from "sap/m/DatePicker";
import Input from "sap/m/Input";
import BaseObject from "sap/ui/base/Object";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import PropertyBinding from "sap/ui/model/PropertyBinding";
import SimpleType from "sap/ui/model/SimpleType";

/**
 * @namespace sci.ams.express.lib.core
 */
export default class SimpleFormValidator extends BaseObject {
    public static async hasError(form: SimpleForm) {
        BusyIndicator.show(0);

        try {
            const results: boolean[] = [];

            for (const control of form.getContent()) {
                switch (true) {
                    case control instanceof Input:
                    case control instanceof DatePicker:
                        results.push(await this.hasInvalidValue(control));
                        break;
                    default:
                        break;
                }
            }

            return results.some(Boolean);
        } finally {
            BusyIndicator.hide();
        }
    }

    private static async hasInvalidValue(control: Input | DatePicker) {
        const binding = control.getBinding("value") as PropertyBinding;
        const value = control.getProperty("value");
        const type = binding.getType() as SimpleType;

        try {
            await type.validateValue(type.parseValue(value, "string"));

            control.setValueState("None");
            control.setValueStateText("");

            return false;
        } catch (error) {
            control.setValueState("Error");
            control.setValueStateText((error as { message: string; }).message);
            
            return true;
        }
    }
}