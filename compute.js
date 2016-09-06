// Compute
//
var joyent = require('./lib/joyent');

exports.View =
{
    title: "Compute Instances",
    elements:
    [
        { control: "stackpanel", width: "*", height: "*", contents: [

            { control: "stackpanel", width: "*", margin: { bottom: 5 }, background: "#ff6600", orientation: "Horizontal", contents: [
                { control: "image", resource: "{logo}", width: 175 },
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

            { control: "stackpanel", width: "*", height: "*", visibility: "{machines}", contents: [
                { control: "listview", select: "None", height: "*", width: "*", margin: { bottom: 0 }, binding: { items: "machines", onItemClick: { command: "onMachineSelected", machine: "{$data}" } }, 
                    itemTemplate:
                    {
                        control: "stackpanel", orientation: "Horizontal", width: "*", padding: { top: 5, bottom: 5 }, contents: [
                            { control: "image", resource: "{icon}", height: 64, width: 64 },
                            {
                                control: "stackpanel", orientation: "Vertical", width: "*", padding: { left: 5 }, contents: [
                                    { control: "text", value: "{name}", width: "*", font: { bold: true, size: 10 }, ellipsize: true },
                                    { control: "text", value: "State: {state}", width: "*", fontsize: 8 },
                                ]
                            }
                        ]
                    }
                }
            ]},

            // Platform-specific Refresh buttons...
            //
            { control: "commandBar.button", text: "Refresh", winIcon: "Refresh", commandBar: "Bottom", binding: "onRefresh", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] }, enabled: "{!loading}" },
            { control: "actionBar.item", text: "Refresh", binding: "onRefresh", filter: { deviceMetric: "os", is: "Android" }, enabled: "{!loading}" }, // !!! Icon?
            { control: "navBar.button", systemItem: "Refresh", binding: "onRefresh", filter: { deviceMetric: "os", is: "iOS" }, enabled: "{!loading}" },
        ]}
    ]
}

exports.InitializeViewModel = function * (context, session, params, state)
{
    var viewModel =
    {
        logo: Synchro.getResourceUrl(context, "joyent-logo.png"),
        dataCenters: joyent.dataCenters,
        dataCenter: session.dataCenter,
        machines: [],
        loading: true,
    }

    if (session.invalidateCompute)
    {
        delete session.invalidateCompute;
        session.invalidateDashboard = true;
    }
    else if (state)
    {
        viewModel.machines = state.machines;
        viewModel.loading = false;
    }

    return viewModel;
}

exports.LoadViewModel = function * (context, session, viewModel)
{
    if (viewModel.machines.length == 0) // If not restored from state
    {
        viewModel.machines = yield joyent.listMachines(context, session.dataCenter);
        viewModel.loading = false;
    }
}

exports.Commands = 
{
    onMachineSelected: function (context, session, viewModel, params)
    {
        var state = {
            machines: viewModel.machines
        }
        return Synchro.pushAndNavigateTo(context, "machine", { machine: params.machine }, state);
    },
    onDataCenter: function * (context, session, viewModel, params)
    {
        session.dataCenter = viewModel.dataCenter;
        session.invalidateDashboard = true;
        viewModel.loading = true;
        yield Synchro.interimUpdateAwaitable(context);

        viewModel.machines = yield joyent.listMachines(context, session.dataCenter);
        viewModel.loading = false;
    },
    onRefresh: function * (context, session, viewModel, params)
    {
        viewModel.loading = true;
        yield Synchro.interimUpdateAwaitable(context);

        viewModel.machines = yield joyent.listMachines(context, session.dataCenter);
        viewModel.loading = false;
    },
}
