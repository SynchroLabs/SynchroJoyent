// Main page
//
var joyent = require('./lib/joyent');

exports.View =
{
    title: "Dashboard",
    elements:
    [
        { control: "stackpanel", width: "*", margin: { bottom: 5 }, background: "#ff6600", contents: [
            { control: "image", resource: "{logo}", width: 175 }
        ]},

        { control: "stackpanel", width: "*", margin: { left: 5, bottom: 5 }, orientation: "Horizontal", contents: [
            { control: "text", value: "Data Center:", verticalAlignment: "Center" },
            { control: "picker", width: 200, verticalAlignment: "Center", binding: { items: "dataCenters", selection: "dataCenter", onSelectionChange: "onDataCenter" } },
        ]},

        { control: "wrappanel", width: "*", orientation: "Horizontal", margin: 0, contents: [

            { control: "border", style: "dashbox", height: 200, binding: "goCompute", contents: [
                { control: "stackpanel", padding: 15, width: "*", contents: [

                    { control: "stackpanel", orientation: "Horizontal",  width: "*", contents: [
                        { control: "text", value: "Compute Instances", style: "dashcap", width: "*" },
                        { control: "image", resource: "{instancesLogo}", width: 40 }
                    ]},

                    { control: "stackpanel", width: "*", orientation: "Horizontal", contents: [
                        { control: "stackpanel", width: "*", orientation: "Vertical", contents: [
                            { control: "text", value: "{running}", color: "White", width: "*", margin: { bottom: 0 }, padding: { bottom: 0 }, fontsize: 20 },
                            { control: "text", value: "running", color: "White", width: "*", margin: { top: 0 }, padding: { top: 0 }, fontsize: 12 },
                        ]},
                        { control: "rectangle", width: 3, height: "*", color: "#8e8e8e" },
                        { control: "stackpanel", width: "*", orientation: "Vertical", contents: [
                            { control: "text", value: "{stopped}", color: "White", width: "*", margin: { bottom: 0 }, padding: { bottom: 0 }, fontsize: 20 },
                            { control: "text", value: "stopped", color: "White", width: "*", margin: { top: 0 }, padding: { top: 0 }, fontsize: 12 },
                        ]},
                    ]},
                ]},
            ]},

            { control: "border", style: "dashbox", height: 200, binding: "goStorage", contents: [
                { control: "stackpanel", padding: 15, width: "*", contents: [
                    { control: "stackpanel", orientation: "Horizontal",  width: "*", contents: [
                        { control: "text", value: "Manta Storage", style: "dashcap", width: "*" },
                        { control: "image", resource: "{mantaLogo}", width: 40 }
                    ]},
                ]},
            ]},

            { control: "border", style: "dashbox", height: 200, binding: "goUsage", contents: [
                { control: "stackpanel", padding: 15, width: "*", contents: [
                    { control: "stackpanel", orientation: "Horizontal",  width: "*", contents: [
                        { control: "text", value: "Current Usage", style: "dashcap", width: "*" },
                        { control: "image", resource: "{usageLogo}", width: 40 }
                    ]},
                ]},
            ]},
        ]}
    ]
}

exports.InitializeViewModel = function * (context, session)
{
    if (!session.dataCenter)
    {
        session.dataCenter = "us-west-1"; // Default data center
    }

    var viewModel =
    {
        logo: Synchro.getResourceUrl(context, "joyent-logo.png"),
        instancesLogo: Synchro.getResourceUrl(context, "instances.png"),
        mantaLogo: Synchro.getResourceUrl(context, "manta.png"),
        usageLogo: Synchro.getResourceUrl(context, "usage.png"),
        dataCenters: joyent.dataCenters,
        dataCenter: session.dataCenter,
        running: "?",
        stopped: "?",
    }
    return viewModel;
}

function * getMachineCounts(context, dataCenter)
{
    var client = joyent.getSdcClient(context, dataCenter);

    var running = yield Synchro.yieldAwaitable(context, function(callback)
    {
        client.countMachines({ state: "running" }, callback);
    });

    var stopped = yield Synchro.yieldAwaitable(context, function(callback)
    {
        client.countMachines({ state: "stopped" }, callback);
    });

    return { running: running[0], stopped: stopped[0] };
}

exports.LoadViewModel = function * (context, session, viewModel)
{
    var counts = yield getMachineCounts(context, session.dataCenter);
    viewModel.running = counts.running;
    viewModel.stopped = counts.stopped;
}

exports.Commands = 
{
    goCompute: function (context, session, viewModel, params)
    {
        return Synchro.pushAndNavigateTo(context, "compute");
    },
    goStorage: function (context, session, viewModel, params)
    {
        return Synchro.pushAndNavigateTo(context, "storage");
    },
    goUsage: function (context, session, viewModel, params)
    {
        // !!!
        // return Synchro.pushAndNavigateTo(context, "usage");
    },
    onDataCenter: function * (context, session, viewModel, params)
    {
        session.dataCenter = viewModel.dataCenter;

        viewModel.running = "?";
        viewModel.stopped = "?";
        yield Synchro.interimUpdateAwaitable(context);

        var counts = yield getMachineCounts(context, session.dataCenter);
        viewModel.running = counts.running;
        viewModel.stopped = counts.stopped;
    },
}
