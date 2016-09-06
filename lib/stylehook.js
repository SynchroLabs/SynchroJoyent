// App-wide Style Hook
//
var styleHelper = require("synchro-api/style-helper");

// The mappings below define the default style to add to each control of the key type in the view.
//
var appStyleMappings = {}

// The "app" styles below will be merged in to any styles provided in the viewModel.  Only app styles that are actually 
// referenced from the view will be merged.  Also, the app styles are merged in such that any style values provided in the
// viewModel will override the cooresponding app style.
//
var appStyles = 
{
    dashbox:
    {
        background: "#6a6a6a",
        height: { os_value: { Web: 200, default: "*" } },
        margin: { top: 0, bottom: 10, right: 10 },
    },
    dashCaption:
    {
        color: "White",
        font: { bold: true, size: { os_value: { Web: 16, default: 12 } } },
    },
    dashValue:
    {
        color: "White",
        font: { bold: true, size: 20 },
        margin: { top: 0, bottom: 0 }, 
        padding: { top: 0, bottom: 0 },
    },
    dashDetails:
    {
        color: "White",
        font: { size: 12 },
        margin: { top: 0 }, 
        padding: { top: 0 },
    }
}

exports.AfterInitializeView = function(route, routeModule, context, session, viewModel, view, metrics, isViewMetricsUpdate)
{
    console.log("Processing styles");
    styleHelper.processViewAndViewModelStyles(viewModel, view, metrics, appStyleMappings, appStyles);
}