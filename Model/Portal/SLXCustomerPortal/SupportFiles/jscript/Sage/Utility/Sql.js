/*globals Sage, dojo*/
define([
        'dojo/_base/array',
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/i18n!./nls/Sql'  
    ],
    function (array, declare, lang, nls) {
        var oSqlUtility = declare('Sage.Utility.Sql', null, {
            _allQuotesReg: null,
            _badQuotesReg: null,
            _closingQuotesReg: null,
            _normalQuotesReg: null,
            _openingQuotesReg: null,
            _selectInClauseReg: null,
            _closingQuotes: ["'", '´', '’', '\u2019'],
            _openingQuotes: ["'", '`', '‘', '\u2018'],
            resources: nls,
            quoteType: {
                apostrophe: 0,
                accent: 1,
                curly: 2,
                unicode: 3
            },
            constructor: function () {
                this.inherited(arguments);
                this._allQuotesReg = new RegExp('[\'`´‘’\u2018\u2019]');
                this._badQuotesReg = new RegExp('[`´‘’\u2018\u2019]');
                this._closingQuotesReg = new RegExp('[\'´’\u2019]');
                this._normalQuotesReg = new RegExp('\'');
                this._openingQuotesReg = new RegExp('[\'`‘\u2018]');
            },
            fixQuoted: function (value) {
                var temp = value;
                if (value && lang.isString(value) && value.length > 0) {
                    if (this._badQuotesReg.test(temp)) {
                        temp = this.removeBadOuterQuotes(temp);
                    }
                    if (this._normalQuotesReg.test(temp)) {
                        // Check if there is an opening quote.
                        var ch = temp.charAt(0);
                        if (this._normalQuotesReg.test(ch)) {
                            // Remove the opening quote.
                            temp = temp.substr(1, temp.length - 1);
                        }
                        if (temp === '') return '';
                        // Check if there is a closing quote.
                        ch = temp.charAt(temp.length - 1);
                        if (this._normalQuotesReg.test(ch)) {
                            // Remove the closing quote.
                            temp = temp.substr(0, temp.length - 1);
                        }
                    }
                } else {
                    return "''";
                }
                return "'" + temp + "'";
            },
            fixQuotes: function (values) {
                if (values && lang.isArray(values)) {
                    array.forEach(values, function (value, idx) {
                        values[idx] = this.fixQuoted(value);
                    }, this);
                    return values.join(',');
                }
                return false;
            },
            fixInClause: function (inClause) {
                var empty = "('')";
                if (inClause && typeof inClause !== 'undefined' && lang.isString(inClause) === false) {
                    if (lang.isArray(inClause)) {
                        inClause = "'" + inClause.toString().replace(/,/g, "','") + "'";
                    } else {
                        inClause = "'" + inClause.toString() + "'";
                    }
                }
                var temp;
                if (inClause && lang.isString(inClause) && lang.trim(inClause).length > 0) {
                    if (this.hasValidApostropheQuoteCount(inClause) === false) {
                        throw new Error(this.resources.InvalidApostropheCount);
                    }
                    temp = inClause
                        .replace(/\r\n/g, ' ')
                        .replace(/\n/g, ' ')
                        .replace(/\r/g, ' ')
                        .trim();
                    if (temp === '') return empty;
                    if (this._badQuotesReg.test(temp)) {
                        if (temp.charAt(0) === '(' && temp.charAt(temp.length - 1) === ')') {
                            temp = temp.substr(1, temp.length - 1);
                            temp = temp.substr(0, temp.length - 1);
                        }
                        if (temp === '') return empty;
                        var isSelect = temp.toUpperCase().indexOf('SELECT') === 0;
                        if (isSelect) {
                            var inQuote = false;
                            var currentOpenQuoteType = -1;
                            var replacePositions = [];
                            for (var i = 0; i < temp.length; i++) {
                                var ch = temp.charAt(i);
                                if (inQuote === false) {
                                    // Look for an opening quote
                                    if (this._openingQuotesReg.test(ch)) {
                                        inQuote = true;
                                        switch (ch) {
                                            case "'":
                                                currentOpenQuoteType = this.quoteType.apostrophe;
                                                break;
                                            case '`':
                                                currentOpenQuoteType = this.quoteType.accent;
                                                replacePositions.push(i);
                                                break;
                                            case '‘':
                                                currentOpenQuoteType = this.quoteType.curly;
                                                replacePositions.push(i);
                                                break;
                                            case '\u2018':
                                                currentOpenQuoteType = this.quoteType.unicode;
                                                replacePositions.push(i);
                                                break;
                                        }
                                    }
                                } else {
                                    // We're in a quote, so find a closing quote
                                    if (this._closingQuotesReg.test(ch)) {
                                        var closingQuoteType = this.translateQuoteType(ch);
                                        if (closingQuoteType == -1) continue;
                                        if (currentOpenQuoteType == closingQuoteType) {
                                            inQuote = false;
                                            switch (currentOpenQuoteType) {
                                                case this.quoteType.accent:
                                                case this.quoteType.curly:
                                                case this.quoteType.unicode:
                                                    replacePositions.push(i);
                                                    break;
                                            }
                                            currentOpenQuoteType = -1;
                                        }
                                    }
                                }
                            }
                            // Replace any bad quotes with apostrophes
                            if (replacePositions && lang.isArray(replacePositions) && replacePositions.length > 0) {
                                array.forEach(replacePositions, function (position) {
                                    temp = temp.substr(0, position) + "'" + temp.substr(position + 1);
                                });
                            }
                            if (typeof console !== 'undefined') {
                                console.debug('fixInClause #1');
                            }
                            if (this.hasValidApostropheQuoteCount(temp) === false) {
                                throw new Error(this.resources.InvalidApostropheCount);
                            }                            
                            return '(' + temp + ')';

                        } else {
                            // We have a single string value, that is not a SELECT, or we have a delimited list of string values.
                            var values = temp.split(',');
                            array.forEach(values, function (value, idx) {
                                values[idx] = value.trim();
                            });
                            var fixed = this.fixQuotes(values);
                            if (fixed) {
                                if (typeof console !== 'undefined') {
                                    console.debug('fixInClause #2');
                                }
                                if (this.hasValidApostropheQuoteCount(fixed) === false) {
                                    throw new Error(this.resources.InvalidApostropheCount);
                                }                                 
                                return '(' + fixed + ')';
                            }
                            if (typeof console !== 'undefined') {
                                console.debug('fixInClause #3');
                            }
                            return empty;
                        }
                    } else {
                        if (temp.charAt(0) != '(') {
                            if (typeof console !== 'undefined') {
                                console.debug('fixInClause #4');
                            }
                            return '(' + temp + ')';
                        }
                        if (typeof console !== 'undefined') {
                            console.debug('fixInClause #5');
                        }
                        return temp;
                    }
                } else {
                    if (inClause && lang.isString(inClause)) {
                        // The inClause is composed entirely of empty spaces or CrLf.
                        temp = inClause
                            .replace(/\r\n/g, '')
                            .replace(/\n/g, '')
                            .replace(/\r/g, ''); // Do [not] trim; since we must allow search for spaces.
                        if (temp.length > 0) {
                            if (typeof console !== 'undefined') {
                                console.debug('fixInClause #6');
                            }
                            return '(\'' + temp + '\')';
                        }
                        if (typeof console !== 'undefined') {
                            console.debug('fixInClause #7');
                        }
                        return empty;
                    }
                }
                // Return null or undefined
                if (typeof console !== 'undefined') {
                    console.debug('fixInClause #8');
                }
                return inClause;
            },
            hasBadOuterQuotes: function (value) {
                if (value && lang.isString(value) && value.length > 0) {
                    if (this._badQuotesReg.test(value)) {
                        var ch = value.charAt(0);
                        if (this._badQuotesReg.test(ch)) {
                            return true;
                        }
                        ch = value.charAt(value.length - 1);
                        if (this._badQuotesReg.test(ch)) {
                            return true;
                        }
                    }
                }
                return false;
            },
            hasValidApostropheQuoteCount: function (value) {
                if (value && lang.isString(value) && value.length > 0) {
                    if (this._normalQuotesReg.test(value)) {
                        var matches = value.match(/'/g);
                        if (matches && lang.isArray(matches) && matches.length > 0) {
                            return (matches.length % 2) === 0;
                        }
                    }
                }
                // 0 is a valid count
                return true;
            },
            removeBadOuterQuotes: function (value) {
                if (this.hasBadOuterQuotes(value)) {
                    var temp = value;
                    // Check if there is an opening bad quote.
                    var ch = temp.charAt(0);
                    if (this._badQuotesReg.test(ch)) {
                        // Remove the opening bad quote.
                        temp = temp.substr(1, temp.length - 1);
                    }
                    if (temp === '') return '';
                    // Check if there is a closing bad quote.
                    ch = temp.charAt(temp.length - 1);
                    if (this._badQuotesReg.test(ch)) {
                        // Remove the closing bad quote.
                        temp = temp.substr(0, temp.length - 1);
                    }
                    return temp;
                }
                return value;
            },
            replaceQuotesAroundValues: function (value) {
                if (value && lang.isString(value) && value.length > 0) {
                    var temp = value;
                    array.forEach([/`(.*?)´/g, /‘(.*?)’/g, /\u2018(.*?)\u2019/g], function (reg) {
                        var matches = temp.match(reg);
                        array.forEach(matches, function (match) {
                            if (match.length == 2) {
                                temp = temp.replace(match, "''");
                            } else {
                                var replacement = match.substr(1, match.length - 1);
                                replacement = replacement.substr(0, replacement.length - 1);
                                temp = temp.replace(match, "'" + replacement + "'");
                            }
                        });
                        return temp;
                    });
                }
                return value;
            },
            translateQuoteType: function (ch) {
                if (ch && lang.isString(ch) && ch.length == 1 && this._allQuotesReg.test(ch)) {
                    switch (ch) {
                        case "'":
                            return this.quoteType.apostrophe;
                        case '`':
                        case '´':
                            return this.quoteType.accent;
                        case '‘':
                        case '’':
                            return this.quoteType.curly;
                        case '\u2018':
                        case '\u2019':
                            return this.quoteType.unicode;
                    }
                }
                return -1;
            }
        });

        return oSqlUtility;
    });

