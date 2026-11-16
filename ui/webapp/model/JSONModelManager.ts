import JSONModel from "sap/ui/model/json/JSONModel";
import BaseObject from "sap/ui/base/Object";
import Device from "sap/ui/Device";
import ManagedObject from "sap/ui/base/ManagedObject";
import { DefaultBindingMode, ModelContainer } from "sci/ams/express/types/JSONModelManager.types";

/**
 * @namespace sci.ams.express.model
 */
export default class JSONModelManager extends BaseObject {
    private readonly container: ModelContainer[] = [];

    public static createDeviceModel() {
        const model = new JSONModel(Device);
        model.setDefaultBindingMode("OneWay");
        return model;
    }

    public getModel(name: string) {
        const containerElement = this.container.find(cont => cont.name === name);

        if (!containerElement) {
            throw new Error("JSONModel with the following name was not found: " + name);
        }

        return containerElement.model;
    }

    public getModelData<T extends object = object>(modelName: string) {
        return this.getModel(modelName).getData() as T;
    }

    public setModelData<T extends object = object>(modelName: string, data: T) {
        this.getModel(modelName).setData(data);
    }

    public getModelProperty<T>(modelName: string, propertyName: string) {
        const property = propertyName.startsWith("/") ? propertyName : `/${propertyName}`;
        return this.getModel(modelName).getProperty(property) as T;
    }

    public setModelProperty(modelName: string, propertyName: string, value: any) {
        const property = propertyName.startsWith("/") ? propertyName : `/${propertyName}`;
        this.getModel(modelName).setProperty(property, value);
    }

    public createModel(modelName: string, data?: string | object, bindingMode: DefaultBindingMode = "TwoWay") {
        const oldModel = this.container.find(cont => cont.name === modelName)?.model;

        if (oldModel) {
            if (typeof data === "string") {
                oldModel.loadData(data);
            } else {
                oldModel.setData(data || {});
            }

            oldModel.setDefaultBindingMode(bindingMode);
            return oldModel;
        } else {
            const model = new JSONModel(data);

            this.container.push({
                name: modelName,
                model: model
            });

            model.setDefaultBindingMode(bindingMode);
            return model;
        }
    }

    public createAndSetModel(target: ManagedObject, modelName: string, data?: string | object, bindingMode?: DefaultBindingMode) {
        const model = this.createModel(modelName, data, bindingMode);
        const oldModel = target.getModel(modelName);

        if (model !== oldModel) {
            target.setModel(model, modelName);
        }

        return model;
    }
}