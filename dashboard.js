// Main page
//
var joyent = require('./lib/joyent');

exports.View =
{
    title: "Dashboard",
    elements:
    [
        { control: "stackpanel", width: "*", margin: { bottom: 5 }, background: "#ff6600", orientation: "Horizontal", contents: [
            { control: "image", resource: "{logo}", height: 53, width: 175 },
            { control: "rectangle", width: "*", height: "1" },
            { select: "First", contents: [
                { control: "button", filter: { deviceMetric: "os", is: "Web" }, verticalAlignment: "Center", margin: { right: 15 }, caption: "Refresh", icon: "refresh", enabled: "{!loading}", binding: "onRefresh" },
                { control: "progressring", height: 50, width: 50, value: "{loading}", visibility: "{loading}", verticalAlignment: "Center" },
            ]},
        ]},

        { control: "stackpanel", width: "*", margin: { left: 5, bottom: 5 }, orientation: "Horizontal", contents: [
            { control: "text", value: "Data Center:", verticalAlignment: "Center" },
            { control: "picker", width: 200, verticalAlignment: "Center", binding: { items: "dataCenters", selection: "dataCenter", onSelectionChange: "onDataCenter" } },
        ]},

        { control: "wrappanel", width: "*", orientation: "Horizontal", margin: 0, contents: [

            { control: "border", style: "dashbox", width: "{dashboxWidth}", margin: { left: "{dashboxLeft}" }, binding: "goCompute", contents: [
                { control: "stackpanel", padding: 15, width: "*", contents: [

                    { control: "stackpanel", orientation: "Horizontal", width: "*", contents: [
                        { control: "text", value: "Compute Instances", style: "dashCaption", margin: { top: 0, botttom: 0 }, width: "*" },
                        { control: "image", resource: "{instancesLogo}", margin: { top: 0, bottom: 0 }, width: 40 }
                    ]},

                    { control: "stackpanel", width: "*", orientation: "Horizontal", contents: [
                        { control: "stackpanel", width: "*", orientation: "Vertical", contents: [
                            { control: "text", value: "{running}", style: "dashValue", width: "*" },
                            { control: "text", value: "running", style: "dashDetails", width: "*" },
                        ]},
                        { control: "rectangle", width: 3, height: "*", color: "#8e8e8e" },
                        { control: "stackpanel", width: "*", orientation: "Vertical", contents: [
                            { control: "text", value: "{stopped}", style: "dashValue", width: "*" },
                            { control: "text", value: "stopped", style: "dashDetails", width: "*" },
                        ]},
                    ]},
                ]},
            ]},

            { control: "border", style: "dashbox", width: "{dashboxWidth}", margin: { left: "{dashboxLeft}" }, binding: "goStorage", contents: [
                { control: "stackpanel", padding: 15, width: "*", contents: [
                    { control: "stackpanel", orientation: "Horizontal",  width: "*", contents: [
                        { control: "text", value: "Manta Storage", style: "dashCaption", width: "*" },
                        { control: "image", resource: "{mantaLogo}", width: 40 }
                    ]},

                    { control: "stackpanel", width: "*", orientation: "Horizontal", contents: [
                        { control: "text", value: "{storageUsed}", style: "dashValue", verticalAlignment: "Bottom" },
                        { control: "text", value: "Mb", style: "dashValue", verticalAlignment: "Bottom", font: { bold: false } },
                    ]},
                ]},
            ]},

            { control: "border", style: "dashbox", width: "{dashboxWidth}", margin: { left: "{dashboxLeft}" }, binding: "goUsage", contents: [
                { control: "stackpanel", padding: 15, width: "*", contents: [
                    { control: "stackpanel", orientation: "Horizontal",  width: "*", contents: [
                        { control: "text", value: "Current Usage", style: "dashCaption", width: "*" },
                        { control: "image", resource: "{usageLogo}", width: 40 }
                    ]},

                    { control: "stackpanel", width: "*", orientation: "Horizontal", contents: [
                        { control: "text", value: "{currentUsage}", style: "dashValue", verticalAlignment: "Bottom" },
                        { control: "text", value: "Spent", style: "dashValue", verticalAlignment: "Bottom", font: { bold: false } },
                    ]},
                ]},
            ]},

            // Platform-specific Refresh buttons...
            //
            { control: "commandBar.button", text: "Refresh", winIcon: "Refresh", commandBar: "Bottom", binding: "onRefresh", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, enabled: "{!loading}" },
            { control: "actionBar.item", text: "Refresh", icon: "refresh", showAsAction: "Always", binding: "onRefresh", filter: { deviceMetric: "os", is: "Android" }, enabled: "{!loading}" },
            { control: "navBar.button", systemItem: "Refresh", binding: "onRefresh", filter: { deviceMetric: "os", is: "iOS" }, enabled: "{!loading}" },
        ]}
    ]
}

exports.InitializeViewModel = function * (context, session, params, state)
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
        dashboxWidth: 300,
        dashboxLeft: 0,
        dataCenters: joyent.dataCenters,
        dataCenter: session.dataCenter,
        running: "?",
        stopped: "?",
        storageUsed: "124.3",
        currentUsage: "$0.00",
        loading: true,
    }

    var metrics = Synchro.getMetrics(context);

    // "Mobile" environments
    //
    if ((metrics.DeviceMetrics.osName !== 'Web') || (metrics.DeviceMetrics.deviceType === 'Phone'))
    {
        viewModel.dashboxWidth = 460;
        viewModel.dashboxLeft = 10;
    }

    if (session.invalidateDashboard)
    {
        delete session.invalidateDashboard;
    }
    else if (state)
    {
        viewModel.running = state.running;
        viewModel.stopped = state.stopped;
        viewModel.loading = false;
    }

    return viewModel;
}

exports.LoadViewModel = function * (context, session, viewModel)
{
    if (viewModel.running == '?') // If not restored from state
    {
        var counts = yield joyent.getMachineCounts(context, session.dataCenter);
        viewModel.running = counts.running;
        viewModel.stopped = counts.stopped;
        viewModel.loading = false;
    }
}

function getState(viewModel)
{
    return {
        running: viewModel.running,
        stopped: viewModel.stopped
    }
}

function * loadCounts(context, session, viewModel)
{
    viewModel.running = "?";
    viewModel.stopped = "?";
    viewModel.loading = true;
    yield Synchro.interimUpdateAwaitable(context);

    var counts = yield joyent.getMachineCounts(context, session.dataCenter);
    viewModel.running = counts.running;
    viewModel.stopped = counts.stopped;
    viewModel.loading = false;
}

exports.Commands = 
{
    goCompute: function (context, session, viewModel, params)
    {
        return Synchro.pushAndNavigateTo(context, "compute", null, getState(viewModel));
    },
    goStorage: function (context, session, viewModel, params)
    {
        return Synchro.pushAndNavigateTo(context, "storage", null, getState(viewModel));
    },
    goUsage: function (context, session, viewModel, params)
    {
        // !!!
        // return Synchro.pushAndNavigateTo(context, "usage");
    },
    onDataCenter: function * (context, session, viewModel, params)
    {
        session.dataCenter = viewModel.dataCenter;
        yield loadCounts(context, session, viewModel);
    },
    onRefresh: function * (context, session, viewModel, params)
    {
        yield loadCounts(context, session, viewModel);
    },
}
