// App-wide Style Hook
//
var styleHelper = require("synchro-api/style-helper");

// The mappings below define the default style to add to each control of the key type in the view.
//
var appStyleMappings = 
{
    // "button": "btnStyle",
    // "text": "txtStyle"
}

// The "app" styles below will be merged in to any styles provided in the viewModel.  Only app styles that are actually 
// referenced from the view will be merged.  Also, the app styles are merged in such that any style values provided in the
// viewModel will override the cooresponding app style.
//
var appStyles = 
{
    dashbox:
    {
        background: "#6a6a6a",
        width: { os_value: { Web: 300, default: 460 } },
        os_merge: 
        {
            Web: 
            {
                margin: { top: 0, left: 0, bottom: 10, right: 10 }
            },
            default:
            {
                margin: { top: 0, left: 10, bottom: 10, right: 10 }
            }
        }
    },
    dashcap:
    {
        color: "White",
        font: { bold: true, size: { os_value: { Web: 16, default: 12 } } },
    },
}

exports.AfterInitializeView = function(route, routeModule, context, session, viewModel, view, metrics, isViewMetricsUpdate)
{
    console.log("Processing styles");
    styleHelper.processViewAndViewModelStyles(viewModel, view, metrics, appStyleMappings, appStyles);
}