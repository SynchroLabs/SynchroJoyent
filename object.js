// Storage Object page
//
var joyent = require('./lib/joyent');

exports.View =
{
    title: "Storage Object",
    elements:
    [
        { control: "stackpanel", width: "*", height: "*", contents: [

            { control: "stackpanel", width: "*", background: "#ff6600", orientation: "Horizontal", contents: [
                { control: "image", resource: "{logo}", width: 175 },
            ]},

            { control: "text", value: "Parent: {object.parent}", width: "*" },

            { control: "stackpanel", orientation: "Horizontal", width: "*", padding: { top: 5, bottom: 5 }, contents: [
                { control: "image", resource: "{object.img}", width: 60, height: 60 },
                { control: "stackpanel", orientation: "Vertical", width: "*", padding: { left: 5 }, contents: [
                    { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 0, contents: [
                        { control: "text", value: "{object.name}", font: { bold: true, size: 10 } },
                        { control: "text", value: "- {object.displaySize}", visibility: "{object.displaySize}", font: { size: 10 } },
                    ]},
                    { control: "text", value: "{object.modified}", width: "*", fontsize: 8 },
                ]},
            ]},

            { control: "stackpanel", width: "*", orientation: "Horizontal", visibility: "{!objectText}", contents: [
                { control: "button", caption: "Open (as text)", icon: "edit", binding: "onOpen" },
                { control: "button", caption: "Delete", icon: "delete", binding: "onDelete" },
            ]},


            { control: "stackpanel", width: "*", height: "*", visibility: "{objectText}", contents: [
                { control: "edit", multiline: true, width: "*", height: "*", binding: "objectText"},
                { control: "stackpanel", width: "*", orientation: "Horizontal", contents: [
                    { control: "button", caption: "Save", icon: "save", binding: "onSaveEdit" },
                    { control: "button", caption: "Cancel", icon: "clear", binding: "onCancelEdit" },
                ]},
            ]},
        ]}
    ]
}

exports.InitializeViewModel = function(context, session, params)
{
    var viewModel =
    {
        logo: Synchro.getResourceUrl(context, "joyent-logo.png"),
        object: params.object,
    }
    return viewModel;
}

exports.Commands = 
{
    onOpen: function * (context, session, viewModel, params)
    {
        // !!! Loading/waiting indicator?
        //
        viewModel.objectText = yield joyent.getFileText(context, viewModel.object.parent + "/" + viewModel.object.name);
    },
    onSaveEdit: function * (context, session, viewModel, params)
    {
        var messageBox = 
        {
            title: "Joyent",
            message: "Save changes to the file: {object.name}?",
            options:
            [
                { label: "Ok", command: "doSaveEdit" },
                { label: "Cancel" },
            ]
        }
        return Synchro.showMessage(context, messageBox);
    },
    doSaveEdit: function * (context, session, viewModel, params)
    {
        yield joyent.putFileText(context, viewModel.object.parent + "/" + viewModel.object.name, viewModel.objectText);
        viewModel.objectText = null;
    },
    onCancelEdit: function * (context, session, viewModel, params)
    {
        viewModel.objectText = null;
    },
    onDelete: function * (context, session, viewModel, params)
    {
        var messageBox = 
        {
            title: "Joyent",
            message: "Delete the file: {object.name}?",
            options:
            [
                { label: "Ok", command: "doDelete" },
                { label: "Cancel" },
            ]
        }
        return Synchro.showMessage(context, messageBox);
    },
    doDelete: function * (context, session, viewModel, params)
    {
        yield joyent.deleteFile(context, viewModel.object.parent + "/" + viewModel.object.name);

        // !!! Exit page (return to parent, signal reload)
        //
        Synchro.pop(context);
    }
}
