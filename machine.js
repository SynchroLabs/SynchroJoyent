// Machine details
//
var joyent = require('./lib/joyent');

exports.View =
{
    title: "Compute Instance",
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

            { control: "stackpanel", width: "*", margin: { left: 5, bottom: 5 }, orientation: "Horizontal", contents: [
                { control: "image", resource: "{machine.icon}", verticalAlignment: "Center", height: 64, width: 64 },
                { control: "text", value: "{machine.name}", verticalAlignment: "Center", font: { bold: true, size: 10 } },
            ]},

            { control: "stackpanel", width: "*", contents: [
                { control: "text", value: "Data Center: {machine.dataCenter}", width: "*", fontsize: 8 },
                { control: "text", value: "Type: {machine.type}", width: "*", fontsize: 8 },
                { control: "text", value: "Brand: {machine.brand}", width: "*", fontsize: 8 },
                { control: "text", value: "Package: {machine.package}", width: "*", fontsize: 8 },
                { control: "text", value: "Memory: {machine.memory}Mb", width: "*", fontsize: 8 },
                { control: "text", value: "Disk: {machine.disk}Gb", width: "*", fontsize: 8 },
                { control: "text", value: "State: {machine.state}", width: "*", fontsize: 8 },
            ]},

            { control: "stackpanel", width: "*", orientation: "Horizontal", contents: [
                // { control: "button", caption: "Start", icon: "play_arrow", binding: "onStart" },
                { control: "button", caption: "Stop", icon: "stop", binding: "onStop" },
                { control: "button", caption: "Reboot", icon: "loop", binding: "onReboot" },
                { control: "button", caption: "Delete", icon: "delete", binding: "onDelete" },
            ]},

            // Platform-specific Refresh buttons...
            //
            { control: "commandBar.button", text: "Refresh", winIcon: "Refresh", commandBar: "Bottom", binding: "onRefresh", filter: { deviceMetric: "os", is: ["Windows", "WinPhone"] } },
            { control: "actionBar.item", text: "Refresh", binding: "onRefresh", filter: { deviceMetric: "os", is: "Android" } }, // !!! Icon?
            { control: "navBar.button", systemItem: "Refresh", binding: "onRefresh", filter: { deviceMetric: "os", is: "iOS" } },
        ]}
    ]
}

exports.InitializeViewModel = function (context, session, params)
{
    var viewModel =
    {
        logo: Synchro.getResourceUrl(context, "joyent-logo.png"),
        machine: params.machine
    }
    return viewModel;
}

exports.Commands = 
{
    onRefresh: function * (context, session, viewModel, params)
    {
        // !!! Waiting indicator / interimUpdate?
        //
        console.log("Machine refresh");
        viewModel.machine = yield joyent.getMachine(context, session.dataCenter, viewModel.machine.id);
    },
    onStart: function * (context, session, viewModel)
    {
        console.log("Machine start"); // !!! TODO
    },
    onStop: function * (context, session, viewModel)
    {
        console.log("Machine stop"); // !!! TODO
    },
    onReboot: function * (context, session, viewModel)
    {
        console.log("Machine reboot"); // !!! TODO
    },
    onDelete: function * (context, session, viewModel)
    {
        console.log("Machine delete"); // !!! TODO
    },
}
