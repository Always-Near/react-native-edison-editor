var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
import React, { Component } from "react";
import WebView from "react-native-webview";
import RNFS from "react-native-fs";
import { Buffer } from "buffer";
import Package from "./package.json";
import "./index.html";
var RNDraftView = (function (_super) {
  __extends(RNDraftView, _super);
  function RNDraftView() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.webViewRef = React.createRef();
    _this.state = {
      editorState: "",
    };
    _this.checkSuggestionChange = function (suggestions) {
      if (!suggestions) {
        return "";
      }
      return suggestions.reduce(function (pre, s) {
        return pre + s.email;
      }, "");
    };
    _this.executeScript = function (functionName, parameter) {
      if (_this.webViewRef.current) {
        _this.webViewRef.current.injectJavaScript(
          "window." +
            functionName +
            "(" +
            (parameter ? "'" + parameter + "'" : "") +
            ");true;"
        );
      }
    };
    _this.onMessage = function (event) {
      var _a = _this.props,
        onToChange = _a.onToChange,
        onCcChange = _a.onCcChange,
        onBccChange = _a.onBccChange,
        onSubjectChange = _a.onSubjectChange,
        onSugTextChange = _a.onSugTextChange,
        onEditorChange = _a.onEditorChange;
      var _b = JSON.parse(event.nativeEvent.data),
        type = _b.type,
        data = _b.data;

      if (type === "sizeChange") {
        _a.onSizeChange(data);
        return;
      }

      if (type === "editPosition") {
        _a.editPosition(data);
        return;
      }

      if (type === "isMounted") {
        _this.widgetMounted();
        return;
      }
      if (type === "editorChange") {
        onEditorChange && onEditorChange(data);
        _this.setState({ editorState: data.replace(/(\r\n|\n|\r)/gm, "") });
        return;
      }
      if (type === "toChange" && onToChange) {
        onToChange(data);
        return;
      }
      if (type === "ccChange" && onCcChange) {
        onCcChange(data);
        return;
      }
      if (type === "bccChange" && onBccChange) {
        onBccChange(data);
        return;
      }
      if (type === "subjectChange" && onSubjectChange) {
        onSubjectChange(data);
        return;
      }
      if (type === "sugTextChange" && onSugTextChange) {
        onSugTextChange(data);
        return;
      }
    };
    _this.widgetMounted = function () {
      var _a = _this.props,
        placeholder = _a.placeholder,
        defaultValue = _a.defaultValue,
        to = _a.to,
        cc = _a.cc,
        bcc = _a.bcc,
        from = _a.from,
        subject = _a.subject,
        _b = _a.showHeader,
        showHeader = _b === void 0 ? false : _b,
        _c = _a.onEditorReady,
        onEditorReady =
          _c === void 0
            ? function () {
                return null;
              }
            : _c;
      _this.executeScript("setHeaderVisible", showHeader.toString());
      if (defaultValue) {
        var formatHtml = Buffer.from(defaultValue, "utf-8").toString("base64");
        _this.executeScript("setDefaultValue", formatHtml);
      }
      if (placeholder) {
        _this.executeScript("setEditorPlaceholder", placeholder);
      }
      if (to) {
        _this.executeScript("setDefaultTo", JSON.stringify(to));
      }
      if (cc) {
        _this.executeScript("setDefaultCc", JSON.stringify(cc));
      }
      if (bcc) {
        _this.executeScript("setDefaultBcc", JSON.stringify(bcc));
      }
      if (from) {
        _this.executeScript("setDefaultFrom", JSON.stringify(from));
      }
      if (subject) {
        _this.executeScript("setDefaultSubject", subject);
      }
      onEditorReady();
    };
    _this.onAddBlock = function (type, params) {
      _this.executeScript(
        "onAddBlock",
        JSON.stringify({ type: type, params: params })
      );
    };
    _this.focus = function () {
      _this.executeScript("focusTextEditor");
    };
    _this.blur = function () {
      _this.executeScript("blurTextEditor");
    };
    _this.setBlockType = function (blockType) {
      _this.executeScript("toggleBlockType", blockType);
    };
    _this.setStyle = function (style) {
      _this.executeScript("toggleInlineStyle", style);
    };
    _this.addImage = function (src) {
      _this.onAddBlock("image", { src: src });
    };
    _this.getEditorState = function () {
      return _this.state.editorState;
    };
    return _this;
  }
  RNDraftView.prototype.UNSAFE_componentWillReceiveProps = function (next) {
    if (
      this.checkSuggestionChange(next.suggestions) !==
      this.checkSuggestionChange(this.props.suggestions)
    ) {
      this.executeScript(
        "setSuggestions",
        JSON.stringify(next.suggestions || [])
      );
    }
  };
  RNDraftView.prototype.render = function () {
    var _a = this.props.style,
      style = _a === void 0 ? { flex: 1 } : _a;
    var htmlPath =
      "file://" +
      RNFS.MainBundlePath +
      "/assets/node_modules/" +
      Package.name +
      "/index.html";
    return React.createElement(WebView, {
      ref: this.webViewRef,
      style: style,
      source: { uri: htmlPath },
      keyboardDisplayRequiresUserAction: false,
      scrollEnabled: false,
      originWhitelist: ["*"],
      onMessage: this.onMessage,
    });
  };
  return RNDraftView;
})(Component);
export default RNDraftView;
