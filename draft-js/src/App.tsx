import React, { createRef } from "react";
import { Editor, EditorState, RichUtils, getDefaultKeyBinding } from "draft-js";
import EdisonEditor, { EdisonUtil } from "edison-editor";
import { stateToHTML } from "draft-js-export-html";
import { Buffer } from "buffer";
import "./styles";

const EventName = {
  IsMounted: "isMounted",
  EditorChange: "editorChange",
  ActiveStyleChange: "activeStyleChange",
  SizeChange: "sizeChange",
  EditPosition: "editPosition",
  OnFocus: "onFocus",
  OnBlur: "onBlur",
} as const;

type State = {
  editorState: EditorState;
  placeholder: string;
  style: React.CSSProperties;
};

class App extends React.Component<any, State> {
  _draftEditorRef: React.RefObject<Editor>;
  constructor(props: any) {
    super(props);
    this.state = {
      editorState: EdisonUtil.htmlToState(""),
      placeholder: "",
      style: {},
    };
    this._draftEditorRef = createRef<Editor>();
  }

  componentDidMount() {
    this.postMessage(EventName.IsMounted, true);
    window.toggleBlockType = this.toggleBlockType;
    window.toggleInlineStyle = this.toggleInlineStyle;
    window.toggleSpecialType = this.toggleSpecialType;
    window.setDefaultValue = this.setDefaultValue;
    window.setStyle = this.setStyle;
    window.setEditorPlaceholder = this.setEditorPlaceholder;
    window.onAddAtomicBlock = this.onAddAtomicBlock;
    window.focusTextEditor = this.focusTextEditor;
    window.blurTextEditor = this.blurTextEditor;
  }

  private postMessage = (type: string, data: any) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: type,
          data: data,
        })
      );
    }
  };

  private setEditorState = (editorState: EditorState) => {
    this.setState({ editorState }, () => {
      this.postMessage(
        EventName.EditorChange,
        stateToHTML(this.state.editorState.getCurrentContent())
      );

      this.postMessage(
        EventName.ActiveStyleChange,
        editorState.getCurrentInlineStyle().toArray()
      );

      setTimeout(() => {
        this.postMessage(EventName.SizeChange, document.body.scrollHeight);
        const currentBlockKey = editorState.getSelection().getStartKey();
        const currentBlockMap = editorState.getCurrentContent().getBlockMap();

        const currentBlockIndex = currentBlockMap
          .keySeq()
          .findIndex((k) => k === currentBlockKey);

        this.postMessage(
          EventName.EditPosition,
          document
            .getElementsByClassName("notranslate public-DraftEditor-content")[0]
            .children[0].children[currentBlockIndex].getBoundingClientRect().top
        );
      }, 50);
    });
  };

  private handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  private mapKeyToEditorCommand = (e: React.KeyboardEvent) => {
    const { editorState } = this.state;
    switch (e.key) {
      case "Tab":
        const newEditorState = RichUtils.onTab(
          e,
          editorState,
          4 /* maxDepth */
        );
        if (newEditorState !== editorState) {
          this.setEditorState(editorState);
        }
        return null;
      default:
        return getDefaultKeyBinding(e);
    }
  };

  // publish functions

  private toggleSpecialType = (command: string) => {
    const { editorState } = this.state;
    if (command === "CLEAR") {
      this.setEditorState(EdisonUtil.clearAllInlineStyle(editorState));
      return;
    }
    if (command === "IndentIncrease") {
      this.setEditorState(EdisonUtil.indentIncrease(editorState));
      return;
    }
    if (command === "IndentDecrease") {
      this.setEditorState(EdisonUtil.indentDecrease(editorState));
      return;
    }
  };

  private toggleBlockType = (blockType: string) => {
    const { editorState } = this.state;
    this.setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  private toggleInlineStyle = (inlineStyle: string) => {
    const { editorState } = this.state;
    this.setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  private setDefaultValue = (html: string) => {
    try {
      if (html) {
        const htmlStr = Buffer.from(html, "base64").toString("utf-8");
        // clear the meta to keep style
        const reg = /<meta[^<>]*name="viewport"[^<>]*\/?>/g;
        const newState = EdisonUtil.htmlToState(htmlStr.replace(reg, ""));
        this.setEditorState(newState);
      }
    } catch (e) {
      console.error(e);
    }
  };

  private setStyle = (style: string) => {
    try {
      const styleJson = JSON.parse(style);
      this.setState({ style: styleJson });
    } catch (err) {
      console.log(err.message);
    }
  };

  private setEditorPlaceholder = (placeholder: string) => {
    this.setState({ placeholder });
  };

  private onAddAtomicBlock = (paramsStr: string) => {
    const { editorState } = this.state;
    try {
      const { type, params } = JSON.parse(paramsStr);
      const newState = EdisonUtil.onAddAtomicBlock(type, params, editorState);
      this.setEditorState(newState);
    } catch (err) {
      console.log(err.message);
    }
  };

  private focusTextEditor = () => {
    this._draftEditorRef.current && this._draftEditorRef.current.focus();
  };

  private blurTextEditor = () => {
    this._draftEditorRef.current && this._draftEditorRef.current.blur();
  };

  private onFocus = () => {
    this.postMessage(EventName.OnFocus, true);
  };

  private onBlur = () => {
    this.postMessage(EventName.OnBlur, true);
  };

  render() {
    const { placeholder, editorState, style } = this.state;

    return (
      <>
        <style>
          {`.public-DraftEditorPlaceholder-root{position: absolute;color: silver;pointer-events: none;z-index: -10000;}`}
        </style>
        <div className={"compose-editor"} style={style}>
          <EdisonEditor
            ref={this._draftEditorRef}
            editorState={editorState}
            onChange={this.setEditorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.mapKeyToEditorCommand}
            placeholder={placeholder}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
          />
        </div>
      </>
    );
  }
}

export default App;
