// Storage page
//
var joyent = require('./lib/joyent');

exports.View =
{
    title: "Manta Storage",
    elements:
    [
        { control: "stackpanel", width: "*", height: "*", contents: [

            { control: "stackpanel", width: "*", background: "#ff6600", orientation: "Horizontal", contents: [
                { control: "image", resource: "{logo}", width: 175 },
                { select: "All", filter: { deviceMetric: "os", is: "Web" }, contents: [
                    { control: "rectangle", width: "*" },
                    { control: "button", verticalAlignment: "Center", margin: { right: 15 }, caption: "Refresh", icon: "refresh", binding: "onRefresh" },
                ]},
            ]},

            { control: "text", value: "Directory: {dir}" },

            { control: "stackpanel", width: "*", height: "*", visibility: "{items}", contents: [
                { control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, binding: { items: "items", onItemClick: { command: "onItemSelected", item: "{$data}" } }, 
                    itemTemplate:
                    { 
                        control: "stackpanel", orientation: "Horizontal", width: "*", padding: { top: 5, bottom: 5 }, contents: [
                            { control: "image", resource: "{img}", width: 60, height: 60 },
                            { control: "stackpanel", orientation: "Vertical", width: "*", padding: { left: 5 }, contents: [
                                { control: "text", value: "{name}", width: "*", font: { bold: true, size: 10 } },
                                { control: "text", value: "Type: {type}", width: "*", fontsize: 8 },
                            ]},
                        ]
                    }
                }
            ]},

            // Platform-specific Refresh buttons...
            //
            { control: "commandBar.button", text: "Refresh", winIcon: "Refresh", commandBar: "Bottom", binding: "onRefresh", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] } },
            { control: "actionBar.item", text: "Refresh", binding: "onRefresh", filter: { deviceMetric: "os", is: "Android" } }, // !!! Icon?
            { control: "navBar.button", systemItem: "Refresh", binding: "onRefresh", filter: { deviceMetric: "os", is: "iOS" } },
        ]}
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        logo: Synchro.getResourceUrl(context, "joyent-logo.png"),
        dir: "/",
        items: []
    }
    return viewModel;
}

exports.LoadViewModel = function * (context, session, viewModel)
{
    viewModel.items = yield joyent.getFiles(context, '~~/');

    if (viewModel.items.length)
    {
        viewModel.dir = viewModel.items[0].parent;
    }
}

exports.Commands = 
{
    onItemSelected: function * (context, session, viewModel, params)
    {
        viewModel.dir = params.item.parent + "/" + params.item.name;
        viewModel.items = yield joyent.getFiles(context, viewModel.dir);
    },
    onRefresh: function * (context, session, viewModel, params)
    {
        // !!! Waiting indicator / interimUpdate?
        //
        console.log("Storage referes"); // !!! TODO
    },
}
