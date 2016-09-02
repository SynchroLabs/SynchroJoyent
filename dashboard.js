// Main page
//
var joyent = require('./lib/joyent');

exports.View =
{
    title: "Dashboard",
    elements:
    [
        { control: "stackpanel", width: "*", margin: { bottom: 5 }, background: "#ff6600", orientation: "Horizontal", contents: [
            { control: "image", resource: "{logo}", width: 175 },
            { select: "All", filter: { deviceMetric: "os", is: "Web" }, contents: [
                { control: "rectangle", width: "*" },
                { control: "button", verticalAlignment: "Center", margin: { right: 15 }, caption: "Refresh", icon: "refresh", binding: "onRefresh" },
            ]},            
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

                    { control: "stackpanel", width: "*", orientation: "Horizontal", contents: [
                        { control: "text", value: "{storageUsed}", color: "White", verticalAlignment: "Bottom", font: { bold: true, size: 20 } },
                        { control: "text", value: "Mb", color: "White", verticalAlignment: "Bottom", fontsize: 20 },
                    ]},
                ]},
            ]},

            { control: "border", style: "dashbox", height: 200, binding: "goUsage", contents: [
                { control: "stackpanel", padding: 15, width: "*", contents: [
                    { control: "stackpanel", orientation: "Horizontal",  width: "*", contents: [
                        { control: "text", value: "Current Usage", style: "dashcap", width: "*" },
                        { control: "image", resource: "{usageLogo}", width: 40 }
                    ]},

                    { control: "stackpanel", width: "*", orientation: "Horizontal", contents: [
                        { control: "text", value: "{currentUsage}", color: "White", verticalAlignment: "Bottom", font: { bold: true, size: 20 } },
                        { control: "text", value: "Spent", color: "White", verticalAlignment: "Bottom", fontsize: 20 },
                    ]},
                ]},
            ]},

            // Platform-specific Refresh buttons...
            //
            { control: "commandBar.button", text: "Refresh", winIcon: "Refresh", commandBar: "Bottom", binding: "onRefresh", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] } },
            { control: "actionBar.item", text: "Refresh", binding: "onRefresh", filter: { deviceMetric: "os", is: "Android" } }, // !!! Icon?
            { control: "navBar.button", systemItem: "Refresh", binding: "onRefresh", filter: { deviceMetric: "os", is: "iOS" } },
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
        storageUsed: "124.3",
        currentUsage: "$0.00"
    }
    return viewModel;
}

exports.LoadViewModel = function * (context, session, viewModel)
{
    var counts = yield joyent.getMachineCounts(context, session.dataCenter);
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

        var counts = yield joyent.getMachineCounts(context, session.dataCenter);
        viewModel.running = counts.running;
        viewModel.stopped = counts.stopped;
    },
    onRefresh: function * (context, session, viewModel, params)
    {
        // !!! Waiting indicator / interimUpdate?
        //
        // !!! TODO
    },
}
