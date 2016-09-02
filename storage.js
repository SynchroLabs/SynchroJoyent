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
            ]},

            { control: "text", value: "Directory: {dir}" },

            { control: "stackpanel", width: "*", height: "*", visibility: "{items}", contents: [
                { control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, binding: { items: "items", onItemClick: { command: "itemSelected", item: "{$data}" } }, 
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
            ]}
        ]}
    ]
}

exports.InitializeViewModel = function(context, session)
{
    var viewModel =
    {
        logo: Synchro.getResourceUrl(context, "joyent-logo.png"),
        dirImage: Synchro.getResourceUrl(context, "folder.png"),
        objImage: Synchro.getResourceUrl(context, "object.png"),
        dir: "/",
        items: []
    }
    return viewModel;
}

function getFiles(context, viewModel, path, callback)
{
    var client = joyent.getMantaClient(context);
    var opts = {};

    var items = [];

    client.ls(path, opts, function (err, res) 
    {
        if (err)
        {
            callback(err);
            return;
        }

        res.on('object', function (obj) {
            obj.img = viewModel.objImage;
            items.push(obj);
            console.log(obj);
        });

        res.on('directory', function (dir) {
            dir.img = viewModel.dirImage;
            items.push(dir);
            console.log(dir);
        });

        res.once('error', function (err) {
            console.error(err.stack);
            callback(err);
        });

        res.once('end', function () {
            console.log('all done:', items);
            callback(null, items);
        });
    });
}

exports.LoadViewModel = function * (context, session, viewModel)
{
    viewModel.items = yield Synchro.yieldAwaitable(context, function(callback)
    {
        getFiles(context, viewModel, '~~/', callback);
    });

    if (viewModel.items.length)
    {
        viewModel.dir = viewModel.items[0].parent;
    }

    console.log("ViewModel:", viewModel);
}

exports.Commands = 
{
    itemSelected: function * (context, session, viewModel, params)
    {
        // !!!
        console.log("Item selected:", params.item);

        var path = params.item.parent + "/" + params.item.name;

        viewModel.dir = path;
        viewModel.items = yield Synchro.yieldAwaitable(context, function(callback)
        {
            getFiles(context, viewModel, path, callback);
        });

        console.log("New viewModel:", viewModel);
    },
}
