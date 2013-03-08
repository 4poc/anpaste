/**
 * SyntaxHighlighter
 * http://alexgorbatchev.com/
 *
 * This brush was originally created by V. Narahyan Raman
 * homepage:   http://narayanraman.blogspot.com
 * brush page: http://narayanraman.blogspot.com/2009/04/syntax-highlighting-for-sahi-code.html
 * profile:    http://www.blogger.com/profile/18094480866664974663
 */
 

SyntaxHighlighter.brushes.SahiScript = function()
{
 var keywords = 'abstract boolean break byte case catch char class const continue debugger ' +
     'default delete do double else enum export extends false final finally float ' +
     'for function goto if implements import in instanceof int interface long native ' +
     'new null package private protected public return short static super switch ' +
     'synchronized this throw throws transient true try typeof var void volatile while with';

 var schedulerFns = '_alert _assertEqual _assertNotEqual _assertNotNull _assertNull _assertTrue _assert _assertNotTrue _assertFalse _assertExists _assertNotExists _callServer _click _clickLinkByAccessor _dragDrop _resetSavedRandom _setSelected _setValue _simulateEvent _call _eval _setGlobal _wait _popup _highlight _log _navigateTo _callServer _doubleClick _rightClick _addMock _removeMock _expectConfirm _setFile _expectPrompt _debug _debugToErr _debugToFile _mouseOver _keyPress _focus _keyDown _keyUp _mockImage _execute _assertContainsText _enableKeepAlive _disableKeepAlive _dragDropXY _deleteCookie _createCookie _clearPrintCalled _saveDownloadedAs _clearLastDownloadedFileName _rteWrite';
 
 var browserFns = '_accessor _button _check _checkbox _image _imageSubmitButton _link _password _radio _select _submit _textarea _textbox _event _getGlobal _random _savedRandom _cell _table _containsText _containsHTML _byId _row _getText _getCellText _div _span _spandiv _option _lastConfirm _reset _file _lastPrompt _lastAlert _get _style _byText _cookie _position _print _printCalled _label _lastDownloadedFileName _rteHTML _rteText _re _prompt _getCellText _getSelectedText _scriptName _isVisible _listItem _parentNode _parentCell _parentRow _parentTable _in';
 
 var otherFns = '_getDB _readFile _logException _logExceptionAsFailure _stopOnError _continueOnError _include';
 
 schedulerFns += (' ' + otherFns);


 this.regexList = [
  { regex: SyntaxHighlighter.regexLib.singleLineCComments, css: 'comments' },   // one line comments
  { regex: SyntaxHighlighter.regexLib.multiLineCComments,  css: 'comments' },   // multiline comments
  { regex: SyntaxHighlighter.regexLib.doubleQuotedString,  css: 'string' },   // double quoted strings
  { regex: SyntaxHighlighter.regexLib.singleQuotedString,  css: 'string' },   // single quoted strings
  { regex: /\s*#.*/gm,          css: 'preprocessor' },  // preprocessor tags like #region and #endregion
  { regex: new RegExp(this.getKeywords(schedulerFns), 'gm'), css: 'color4' },    // operators and such
  { regex: new RegExp(this.getKeywords(browserFns), 'gm'), css: 'color5' },    // operators and such
  { regex: new RegExp(this.getKeywords(keywords), 'gm'),  css: 'keyword' }   // keywords
  ];
 
 this.forHtmlScript(SyntaxHighlighter.regexLib.scriptScriptTags);
};

SyntaxHighlighter.brushes.SahiScript.prototype = new SyntaxHighlighter.Highlighter();
SyntaxHighlighter.brushes.SahiScript.aliases = ['sahi', 'sahiscript'];
