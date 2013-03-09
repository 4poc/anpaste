
// for more information about this:
// http://jmrware.com/articles/2011/sh-bug/SyntaxHighlighterBug.html

$(function () {
SyntaxHighlighter.Highlighter.prototype.findMatches = function(regexList, code)                   // Rev:20110216_1700
{
    var matches = [];                                       // Return value. Array of Match objects.
    if (!regexList) return matches;                         // If regexlist is not defined, we're done.
    var nregex = regexList.length;                          // Loop end value.
    var pos = 0;                                            // Position within code string to begin regex search.
    var re, minIndex, resultMatch, func, match;             // Some locals.
    function defaultAdd(m, r) { return m[0]; };             // Dummy brush modify result function.
    var nextMatch = true;                                   // Prime the pump.
    while(nextMatch) {                                      // One regex match per loop. Advance pos through code.
        nextMatch = null;                                   // Assume this will be the last time through.
        minIndex = code.length + 1;                         // Reset min-match-index to impossibly large value.
        for (var i = 0; i < nregex; i++) {                  // Loop though all regexes at this pos.
            if (typeof(re = regexList[i]) === "object" && re.regex.global) { // Process only 'g'-flagged regexes.
                re.regex.lastIndex = pos;                   // Start search at same pos for each regex.
                if ((match = re.regex.exec(code)) !== null) {// Check if this regex matches anywhere?
                    if (match.index === pos) {              // Yes. Check if matched on first char?
                        nextMatch = {r: re, m: match};      // Yes. This is unconditionally our next match.
                        break;                              // Exit "try-all-regexes" for loop.
                    } // Otherwise we matched, but not on the first char. Need to run all regexes to find best.
                    if (match.index < minIndex) {           // Check if we have a new best match?
                        minIndex = match.index;             // Yes, set the bar a little lower.
                        nextMatch = {r: re, m: match};      // Save needed items for Match object.
                    }       
                }
            } // End if re is object.
        } // End for loop.
        if (nextMatch) {                                    // Check if one of the regexes matched?
            func = nextMatch.r.func ? nextMatch.r.func : defaultAdd;
            resultMatch = func(nextMatch.m, nextMatch.r);   // Allow brush option to customize result.
            if (typeof(resultMatch) === 'string')           // Check if we need a new Match object?
                resultMatch = new SyntaxHighlighter.Match(resultMatch, nextMatch.m.index, nextMatch.r.css); // Yes.
            matches.push(resultMatch);                      // Place this match on top of the stack.
            pos = nextMatch.r.regex.lastIndex;              // Adjust pos forward to end of this match.
        }
    } // End while loop.
    return matches;                                         // return array of regex matches
};


});


