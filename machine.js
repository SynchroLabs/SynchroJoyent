// Machine details
//
exports.View =
{
    title: "Compute Instance",
    elements:
    [
        { control: "stackpanel", width: "*", height: "*", contents: [

            { control: "stackpanel", width: "*", background: "#ff6600", contents: [
                { control: "image", resource: "{logo}", width: 175 }
            ]},

            { control: "stackpanel", width: "*", contents: [
                { control: "text", value: "{machine.name}", width: "*", font: { bold: true, size: 10 } },
                { control: "text", value: "Data Center: {machine.dataCenter}", width: "*", fontsize: 8 },
                { control: "text", value: "Type: {machine.type}", width: "*", fontsize: 8 },
                { control: "text", value: "Brand: {machine.brand}", width: "*", fontsize: 8 },
                { control: "text", value: "Package: {machine.package}", width: "*", fontsize: 8 },
                { control: "text", value: "Memory: {machine.memory}Mb", width: "*", fontsize: 8 },
                { control: "text", value: "Disk: {machine.disk}Gb", width: "*", fontsize: 8 },
                { control: "text", value: "State: {machine.state}", width: "*", fontsize: 8 },
            ]},

            { control: "stackpanel", width: "*", orientation: "Horizontal", contents: [
                { control: "button", caption: "Stop", icon: "stop" },
                { control: "button", caption: "Reboot", icon: "loop" },
                { control: "button", caption: "Delete", icon: "block" },
            ]},

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
