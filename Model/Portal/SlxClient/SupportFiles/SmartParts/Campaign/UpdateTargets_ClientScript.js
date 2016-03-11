Sage.namespace("Sage.UI.Forms");
Sage.UI.Forms.UpdateTargets = {
    _workSpace: {},
    init: function (workSpace) {
        this._workSpace = workSpace;
    },
    optionChange: function (ddlOptions) {
        dojo.query('+ input[type="hidden"]', dojo.byId(ddlOptions)).forEach(function (node, index, arr) {
            this.setOption(node.value);
        }, this);
    },
    setOption: function (option) {
        this.showControl(dojo.byId(this._workSpace.optionStatusId), (option === "0"));
        this.showControl(dojo.byId(this._workSpace.optionStageId), (option === "1"));
        this.showControl(dojo.byId(this._workSpace.optionInitializeTargetId), (option === "2"));
        this.showControl(dojo.byId(this._workSpace.optionAddResponseId), (option === "3"));
    },
    showControl: function (ctrlId, show) {
        var ctrl = dojo.byId(ctrlId);
        if (ctrl != null) {
            if (show) {
                ctrl.style.display = 'block';
            } else {
                ctrl.style.display = 'none';
            }
        }
    }
};
if (typeof Sys !== 'undefined')
    Sys.Application.notifyScriptLoaded();