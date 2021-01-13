import React, { useState, createRef, useEffect } from "react";
import { EditorState, RichUtils, getDefaultKeyBinding } from "draft-js";
import EdisonEditor, { onAddBlock } from "edison-editor";
import { stateFromHTML } from "draft-js-import-html";
import { stateToHTML } from "draft-js-export-html";
import Header from "./header";

function App() {
  const _draftEditorRef = createRef();
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [placeholder, setPlaceholder] = useState("");
  const [isMounted, setMountStatus] = useState(false);

  useEffect(() => {
    if (!isMounted) {
      setMountStatus(true);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            isMounted: true,
          })
        );
      }
    }
  }, [isMounted]);

  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return true;
    }
    return false;
  };

  const mapKeyToEditorCommand = (e) => {
    switch (e.keyCode) {
      case 9: // TAB
        const newEditorState = RichUtils.onTab(
          e,
          editorState,
          4 /* maxDepth */
        );
        if (newEditorState !== editorState) {
          setEditorState(newEditorState);
        }
        return;
      default:
        return getDefaultKeyBinding(e);
    }
  };

  const toggleBlockType = (blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const toggleInlineStyle = (inlineStyle) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  const setDefaultValue = (html) => {
    try {
      if (html) {
        setEditorState(EditorState.createWithContent(stateFromHTML(html)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setEditorPlaceholder = (placeholder) => {
    setPlaceholder(placeholder);
  };

  const onAddBlockEntity = (paramsStr) => {
    try {
      const { type, params } = JSON.parse(paramsStr);
      const newState = onAddBlock(type, params, editorState);
      setEditorState(newState);
    } catch (err) {
      console.log(err.message);
    }
  };

  const focusTextEditor = () => {
    _draftEditorRef.current && _draftEditorRef.current.focus();
  };

  const blurTextEditor = () => {
    _draftEditorRef.current && _draftEditorRef.current.blur();
  };

  window.toggleBlockType = toggleBlockType;
  window.toggleInlineStyle = toggleInlineStyle;
  window.setDefaultValue = setDefaultValue;
  window.setEditorPlaceholder = setEditorPlaceholder;
  window.onAddBlock = onAddBlockEntity;
  window.focusTextEditor = focusTextEditor;
  window.blurTextEditor = blurTextEditor;

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        editorState: stateToHTML(editorState.getCurrentContent()),
      })
    );
  }

  return (
    <>
      <style>
        {`.public-DraftEditorPlaceholder-root{position: absolute;color: silver;pointer-events: none;z-index: -10000;}`}
      </style>
      <Header />
      <EdisonEditor
        ref={_draftEditorRef}
        editorState={editorState}
        onChange={setEditorState}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={mapKeyToEditorCommand}
        placeholder={placeholder}
      />
    </>
  );
}

export default App;
