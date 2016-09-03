// Joyent
//
var smartdc = require('smartdc');
var manta = require('manta');

exports.dataCenters = ["us-east-1", "us-east-2", "us-east-3", "us-sw-1", "us-west-1", "eu-ams-1"];

function getSdcClient(context, dataCenter)
{
    var account = Synchro.getConfig(context, "SDC_ACCOUNT");
    var keyId = Synchro.getConfig(context, "SDC_KEY_ID");
    var key = new Buffer(Synchro.getConfig(context, "SDC_KEY64"), 'base64').toString();
    // var url = Synchro.getConfig(context, "SDC_URL");
    var url = "https://" + dataCenter + ".api.joyent.com";

    return smartdc.createClient({
        sign: smartdc.privateKeySigner({
            key: key,
            keyId: keyId,
            user: account
        }),
        user: account,
        url: url
    });
}

function getMantaClient(context)
{
    var account = Synchro.getConfig(context, "SDC_ACCOUNT");
    var keyId = Synchro.getConfig(context, "SDC_KEY_ID");
    var key = new Buffer(Synchro.getConfig(context, "SDC_KEY64"), 'base64').toString();
    var url = Synchro.getConfig(context, "MANTA_URL");

    return manta.createClient({
        sign: manta.privateKeySigner({
            key: key,
            keyId: keyId,
            user: account
        }),
        user: account,
        url: url
    });
}

function * getMachineCounts(context, dataCenter)
{
    var client = getSdcClient(context, dataCenter);

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

function processMachine(machine, dataCenter, dockerLogo, tritonLogo)
{
    machine.type = machine.docker ? "Docker" : "Triton";
    machine.icon = machine.docker ? dockerLogo : tritonLogo;
    machine.dataCenter = dataCenter;
    machine.disk = machine.disk/1024; // Convert to Gb
    console.log('Machine: ' + JSON.stringify(machine, null, 2));
}

function * listMachines(context, dataCenter)
{
    var dockerLogo = Synchro.getResourceUrl(context, "docker64.png");
    var tritonLogo = Synchro.getResourceUrl(context, "triton64.png");

    var client = getSdcClient(context, dataCenter);

    var machinesResult = yield Synchro.yieldAwaitable(context, function(callback)
    {
        client.listMachines(callback);
    });

    var machines = machinesResult[0];

    machines.forEach(function(machine){
        processMachine(machine, dataCenter, dockerLogo, tritonLogo)
    });

    return machines;
}

function * getMachine(context, dataCenter, id, noCache)
{
    var dockerLogo = Synchro.getResourceUrl(context, "docker64.png");
    var tritonLogo = Synchro.getResourceUrl(context, "triton64.png");

    var client = getSdcClient(context, dataCenter);

    var machineResult = yield Synchro.yieldAwaitable(context, function(callback)
    {
        client.getMachine(id, callback, null, null, noCache);
    });

    var machine = machineResult[0];

    console.log("Got machine:", machine);

    processMachine(machine, dataCenter, dockerLogo, tritonLogo)

    return machine;
}

function humanFileSize(size) {
    var i = Math.floor( Math.log(size) / Math.log(1024) );
    return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['bytes', 'KB', 'MB', 'GB', 'TB'][i];
};

function * getFiles(context, path)
{
    var dirImage = Synchro.getResourceUrl(context, "folder_icon.png");
    var objImage = Synchro.getResourceUrl(context, "object.png");

    var client = getMantaClient(context);

    return yield Synchro.yieldAwaitable(context, function(callback)
    {
        var items = [];

        var opts = {};
        client.ls(path, opts, function (err, res) 
        {
            if (err)
            {
                callback(err);
                return;
            }

            res.on('object', function (obj) {
                obj.img = objImage;
                obj.modified = new Date(obj.mtime).toUTCString("en-US");
                obj.displaySize = humanFileSize(obj.size);
                items.push(obj);
            });

            res.on('directory', function (dir) {
                dir.img = dirImage;
                dir.modified = new Date(dir.mtime).toUTCString("en-US");
                items.push(dir);
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
    });
}

exports.getSdcClient = getSdcClient;
exports.getMantaClient = getMantaClient;
exports.getMachineCounts = getMachineCounts;
exports.listMachines = listMachines;
exports.getMachine = getMachine;
exports.getFiles = getFiles;