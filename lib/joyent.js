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
exports.getSdcClient = getSdcClient;

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
exports.getMantaClient = getMantaClient;
