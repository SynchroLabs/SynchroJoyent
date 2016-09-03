// Storage page
//
var joyent = require('./lib/joyent');
var path = require('path');

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

            { control: "text", value: "Directory: {dir}", width: "*" },

            { control: "stackpanel", width: "*", height: "*", visibility: "{items}", contents: [
                { control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, binding: { items: "items", onItemClick: { command: "onItemSelected", item: "{$data}" } }, 
                    itemTemplate:
                    { 
                        control: "stackpanel", orientation: "Horizontal", width: "*", padding: { top: 5, bottom: 5 }, contents: [
                            { control: "image", resource: "{img}", width: 60, height: 60 },
                            { control: "stackpanel", orientation: "Vertical", width: "*", padding: { left: 5 }, contents: [
                                { control: "stackpanel", orientation: "Horizontal", width: "*", padding: 0, contents: [
                                    { control: "text", value: "{name}", font: { bold: true, size: 10 } },
                                    { control: "text", value: "- {displaySize}", visibility: "{displaySize}", font: { size: 10 } },
                                ]},
                                { control: "text", value: "{modified}", width: "*", fontsize: 8 },
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

function * getFiles(context, dir)
{
    var items = yield joyent.getFiles(context, dir);

    if ((dir !== '~~/') && (path.posix.dirname(dir) != '/'))
    {
        var parent = {
            name: "..",
            type: "directory",
            img: Synchro.getResourceUrl(context, "folder_up_icon.png"),
        }
        items.unshift(parent);
    }

    return items;
}

exports.LoadViewModel = function * (context, session, viewModel)
{
    if (!session.dir)
    {
        session.dir = '~~/';
    }

    viewModel.items = yield getFiles(context, session.dir);

    if ((session.dir === '~~/') && viewModel.items.length)
    {
        session.dir = viewModel.items[0].parent;
    }

    viewModel.dir = session.dir;
}

exports.Commands = 
{
    onItemSelected: function * (context, session, viewModel, params)
    {
        if (params.item.type === 'object')
        {
            Synchro.pushAndNavigateTo(context, "object", { object: params.item });
        }
        else
        {
            if (params.item.name === '..')
            {
                session.dir = path.posix.dirname(session.dir);
            }
            else
            {
                session.dir = params.item.parent + "/" + params.item.name;
            }
            viewModel.items = yield getFiles(context, session.dir);
            viewModel.dir = session.dir;
        }
    },
    onRefresh: function * (context, session, viewModel, params)
    {
        // !!! Waiting indicator / interimUpdate?
        //
        console.log("Storage referes"); // !!! TODO
    },
}
