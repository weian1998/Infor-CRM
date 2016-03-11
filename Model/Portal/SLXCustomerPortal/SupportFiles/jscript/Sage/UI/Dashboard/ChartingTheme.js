define([
        "dojox/charting/Theme",
        "dojox/charting/themes/common"
],
function (Theme) {
    // based off of Julie.cs dojo theme
    // created by Julie Santilli (Claro-based theme)
    // Updated by Mark Dykun for Infor color schemes

    var themes = dojox.charting.themes;
    themes.Julie = new Theme({
        seriesThemes: [
            { fill: "#005bb8", stroke: { color: "#005bb8" } }, //header blue
            { fill: "#d5000e", stroke: { color: "#d5000e" } }, //dark red
            { fill: "#157a13", stroke: { color: "#157a13" } }, //dark green
            { fill: "#f96089", stroke: { color: "#f96089" } }, //med red
            { fill: "#47b2f0", stroke: { color: "#47b2f0" } }, //medium blue
            { fill: "#4fb521", stroke: { color: "#4fb521" } }, //med green
            { fill: "#ff8400", stroke: { color: "#ff8400" } }, //orange
            { fill: "#ffb8bd", stroke: { color: "#ffb8bd" } }, //light red
            { fill: "#bce8fc", stroke: { color: "#bce8fc" } }, //light blue
            { fill: "#bff485", stroke: { color: "#bff485" } }, //light green
            { fill: "#ff8400", stroke: { color: "#ff8400" } }, //orange
        ],
        chart: {
            fontColor: "#b3b3b3",
            font: "normal normal normal 8pt Helvetica, Arial, sans-serif"
        },
        series: {
            stroke: { width: 2, color: "#b3b3b3" },
            position: "center",
            font: "normal normal normal 8pt Helvetica, Arial, sans-serif",
            fontColor: "#b3b3b3"
        },
        axis: {
            tick: {
                color: "#b3b3b3",
                outline: null,
                font: "normal normal normal 8pt Helvetica, Arial, sans-serif",
                fontColor: "#b3b3b3"
            }
        },
    });

    themes.Julie.next = function (elementType, mixin, doPost) {
        var s, theme;
        if (elementType === "line" || elementType === "area") {

            s = this.seriesThemes[this._current % this.seriesThemes.length];
            s.fill.space = "plot";
            s.stroke.color = "#005bb8";

            theme = Theme.prototype.next.apply(this, arguments);
            s.fill.space = "shape";

            return theme;
        }
        if (elementType === "column" || elementType === "bar") {
            s = this.seriesThemes[this._current % this.seriesThemes.length];
            s.stroke.color = "#fff";
            theme = Theme.prototype.next.apply(this, arguments);
            return theme;
        } else {
            s = this.seriesThemes[this._current % this.seriesThemes.length];
            return Theme.prototype.next.apply(this, arguments);
        }
    };

    themes.Julie.post = function (theme, elementType) {
        theme = Theme.prototype.post.apply(this, arguments);
        return theme;
    };

    return themes.Julie;
});
