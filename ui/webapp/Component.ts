import UIComponent from "sap/ui/core/UIComponent";
import { MetadataOptions } from "sap/ui/core/Component";
import JSONModelManager from "sci/ams/express/model/JSONModelManager";

/**
 * @namespace sci.ams.express
 */
export default class Component extends UIComponent {
    public static metadata: MetadataOptions = {
        manifest: "json"
    };

    public override init(): void {
        super.init();
        this.setModel(JSONModelManager.createDeviceModel(), "device");
        this.getRouter().initialize();
    }
}