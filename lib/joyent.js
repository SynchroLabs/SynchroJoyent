// Joyent
//
var smartdc = require('smartdc');
var manta = require('manta');
var MemoryStream = require('memorystream');

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

exports.getMachineCounts = function * (context, dataCenter)
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

exports.listMachines = function * (context, dataCenter)
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

exports.getMachine = function * (context, dataCenter, id, noCache)
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

exports.startMachine = function * (context, dataCenter, id)
{
    var client = getSdcClient(context, dataCenter);
    yield Synchro.yieldAwaitable(context, function(callback)
    {
        client.startMachine(id, callback);
    });
}

exports.stopMachine = function * (context, dataCenter, id)
{
    var client = getSdcClient(context, dataCenter);
    yield Synchro.yieldAwaitable(context, function(callback)
    {
        client.stopMachine(id, callback);
    });
}

exports.rebootMachine = function * (context, dataCenter, id)
{
    var client = getSdcClient(context, dataCenter);
    yield Synchro.yieldAwaitable(context, function(callback)
    {
        client.rebootMachine(id, callback);
    });
}

exports.deleteMachine = function * (context, dataCenter, id)
{
    var client = getSdcClient(context, dataCenter);
    yield Synchro.yieldAwaitable(context, function(callback)
    {
        client.deleteMachine(id, callback);
    });
}

function humanFileSize(size) {
    var i = Math.floor( Math.log(size) / Math.log(1024) );
    return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['bytes', 'KB', 'MB', 'GB', 'TB'][i];
};

exports.getFiles = function * (context, path)
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

exports.getFileText = function * (context, path)
{
    var client = getMantaClient(context);

    var result = yield function(done) { client.get(path, done) }
    if (result && result.length)
    {
        var stream = result[0];

        var content = yield function(done) 
        {
            const chunks = [];
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            stream.on('end', () => {
                var content = chunks.join('');
                done(null, content);
            });
        }
        console.log("Returning:", content);
        return content;
    }
    else
    {
        console.log("Error: No file returned for path:", path);
    }
}

exports.putFileText = function * (context, path, text)
{
    var client = getMantaClient(context);

    var stream = new MemoryStream();

    yield function(done)
    {
        client.put(path, stream, { mkdirs: true }, function (err) 
        {
            if (err)
            {
                console.log("Error uploading to path: %s, %s", path, err);
            }
            done(err);
        });

        stream.write(text);
        stream.end();
    }
}

exports.deleteFile = function(context, path)
{
    // !!!
}
