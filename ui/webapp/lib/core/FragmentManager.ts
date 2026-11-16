import BaseController from "sci/ams/express/controller/BaseController";
import Dialog from "sap/m/Dialog";
import BaseObject from "sap/ui/base/Object";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import BusyIndicator from "sap/ui/core/BusyIndicator";

/**
 * @namespace sci.ams.express.lib.core
 */
export default class FragmentManager extends BaseObject {
    private readonly controller: BaseController;
    private readonly basePath = "sci.ams.express.fragments";
    private content?: Control | Control[];

    constructor(controller: BaseController) {
        super();
        this.controller = controller;
    }

    public async load<T extends Control | Control[] = Control | Control[]>(path: string, addDependent = true) {
        const content = await Fragment.load({
            id: this.controller.getCurrentView().getId(),
            controller: this.controller,
            name: this.getFullPath(path)
        });

        if (addDependent) {
            if (Array.isArray(content)) {
                content.forEach((cont) => {
                    this.controller.getCurrentView().removeDependent(cont);
                    this.controller.getCurrentView().addDependent(cont);
                });
            } else {
                this.controller.getCurrentView().removeDependent(content);
                this.controller.getCurrentView().addDependent(content);
            }
        }

        this.content = content;
        return content as T;
    }

    public getContent<T extends Control | Control[] = Control | Control[]>() {
        if (this.content == null) {
            throw new Error("No fragment content was loaded. Please use load() or openDialog() methods to load the content.");
        }

        return this.content as T;
    }

    public async openDialog(path: string) {
        BusyIndicator.show(0);

        const dialog = await this.load(path);

        if (dialog instanceof Dialog === false) {
            BusyIndicator.hide();
            throw new Error("No sap.m.Dialog was found in the loaded fragment.");
        }

        this.controller.getCurrentView().removeDependent(dialog);
        this.controller.getCurrentView().addDependent(dialog);
        dialog.open();

        BusyIndicator.hide();
        return dialog;
    }

    public closeDialog() {
        try {
            const dialog = this.getContent();

            if (dialog instanceof Dialog && dialog.isOpen()) {
                dialog.close();
                dialog.destroy();
            }
        } catch (error) {
            throw new Error("No dialog was found. Please first use openDialog() method to open a sap.m.Dialog instance.");
        }
    }

    private getFullPath(path: string) {
        if (path.startsWith(this.basePath)) {
            return path;
        }

        return this.basePath + "." + path;
    }
}