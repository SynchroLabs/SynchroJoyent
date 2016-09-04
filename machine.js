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

            { control: "stackpanel", width: "*", orientation: "Horizontal", visibility: "{!operation}", contents: [
                { control: "button", caption: "Start", icon: "play_arrow", binding: "onStart" },
                { control: "button", caption: "Stop", icon: "stop", binding: "onStop" },
                { control: "button", caption: "Reboot", icon: "loop", binding: "onReboot" },
                { control: "button", caption: "Delete", icon: "delete", binding: "onDelete" },
            ]},

            { select: "First", contents: [
                { filter: { deviceMetric: "os", is: "Web" }, control: "stackpanel", orientation: "Vertical", visibility: "{operation}", contents: [
                    { control: "progressring", width: 300, value: "{operation}", verticalAlignment: "Center" },
                    { control: "text", value: "{operation}...", foreground: "Red", font: { size: 24, bold: true }, verticalAlignment: "Center" },
                ] },
                { control: "stackpanel", orientation: "Horizontal", visibility: "{operation}", contents: [
                    { control: "progressring", height: 50, width: 50, value: "{operation}", verticalAlignment: "Center" },
                    { control: "text", value: "{operation}...", foreground: "Red", font: { size: 24, bold: true }, verticalAlignment: "Center" },
                ] },
            ] },

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

function waitInterval(intervalMillis, callback)
{
    setTimeout(function(){callback()}, intervalMillis);
}

// https://apidocs.joyent.com/cloudapi/#machine-state-diagram
//
// Running - Stop, Reboot, Delete
// Stopped - Start, Delete
// Stopping - <none> - wait
// Deleted - <none>
//
function * processOperation(context, session, viewModel, operation, operationTime)
{
    // Check status until we get one that represents termination of operation
    //
    // Operations: Starting, Stopping, Rebooting, Deleting
    //
    var terminate = false;
 
    viewModel.operation = operation;
    while (Synchro.isActiveInstance(context) && !terminate)
    {
        yield Synchro.interimUpdateAwaitable(context);

        if (operation === 'Rebooting')
        {
            var audit = yield joyent.getMachineAudit(context, session.dataCenter, viewModel.machine.id);
            var actions = audit.filter(function (a) {
                return (a.action === 'reboot' && (new Date(a.time) > operationTime));
            });

            if (actions.length > 0)
            {
                terminate = true;
                if (actions[0].success !== 'yes') 
                {
                    // !!! Alert the user that reboot failed
                }
            }
        }
        else // operation is: Starting - Stopping - Deleting
        {
            try
            {
                viewModel.machine = yield joyent.getMachine(context, session.dataCenter, viewModel.machine.id, true); // nocache
                if (operation === 'Starting')
                {
                    terminate = (viewModel.machine.state === 'running');
                }
                else if (operation === 'Stopping')
                {
                    terminate = (viewModel.machine.state === 'stopped');
                }
            }
            catch (err)
            {
                if ((operation === 'Deleting') && (err.statusCode === 410))
                {
                    viewModel.machine.state = 'deleted';
                    terminate = true;
                }
                else
                {
                    throw err;
                }
            }
        }

        if (terminate)
        {
            viewModel.operation = null;
        }
        else
        {
            // Wait before we try again...
            //
            yield Synchro.yieldAwaitable(context, function(cb){ waitInterval(3000, cb) });   
        }
    } 
}

exports.Commands = 
{
    onRefresh: function * (context, session, viewModel, params)
    {
        // !!! Waiting indicator / interimUpdate?
        //
        console.log("Machine refresh");
        viewModel.machine = yield joyent.getMachine(context, session.dataCenter, viewModel.machine.id); // !!! add "true" as last param for nocache
    },
    onStart: function * (context, session, viewModel)
    {
        console.log("Machine start");
        yield joyent.startMachine(context, session.dataCenter, viewModel.machine.id);
        yield processOperation(context, session, viewModel, "Starting");
    },
    onStop: function * (context, session, viewModel)
    {
        console.log("Machine stop");
        yield joyent.stopMachine(context, session.dataCenter, viewModel.machine.id);
        yield processOperation(context, session, viewModel, "Stopping");
    },
    onReboot: function * (context, session, viewModel)
    {
        console.log("Machine reboot");
        var operationTime = new Date();
        yield joyent.rebootMachine(context, session.dataCenter, viewModel.machine.id);
        yield processOperation(context, session, viewModel, "Rebooting", operationTime);
    },
    onDelete: function * (context, session, viewModel)
    {
        console.log("Machine delete");
        yield joyent.deleteMachine(context, session.dataCenter, viewModel.machine.id);
        yield processOperation(context, session, viewModel, "Deleting");
    },
}
