import BindingMode from "sap/ui/model/BindingMode";
import JSONModel from "sap/ui/model/json/JSONModel";

export type ModelContainer = {
    name: string;
    model: JSONModel;
};

export type DefaultBindingMode = BindingMode | keyof typeof BindingMode;