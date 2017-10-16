// @flow

import React, { Component } from 'react';
import { Editor } from 'slate-react';
import { resetKeyGenerator } from 'slate';
import Html from 'slate-html-serializer';
import { schema } from './constants';
import HoverMenu from './HoverMenu';
import rules from './serializer';
import styles from './Editor.css';
import type { BlockType, MarkType } from './constants';

const parseHtml =
  typeof DOMParser === 'undefined' && require('parse5').parseFragment;
const htmlArgs = { rules };
if (parseHtml) htmlArgs.parseHtml = parseHtml;
const html = new Html(htmlArgs);

type Document = {
  getClosest: (string, () => boolean) => void
};

type EditorState = {
  document: Document,
  change: () => Change,
  blocks: []
};
type Change = {
  state: EditorState,
  toggleMark: MarkType => Change,
  setBlock: BlockType => Change,
  unwrapBlock: BlockType => Change,
  wrapBlock: BlockType => Change,
  splitBlock: () => Change
};

type Props = {
  value?: string,
  onChange: string => void
};

type State = {
  menu?: ReactElement,
  serialized: string,
  state: EditorState
};

class CustomEditor extends Component {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);
    resetKeyGenerator();
    const serialized = this.props.value || '<p></p>';
    this.state = {
      state: html.deserialize(serialized),
      schema,
      serialized
    };
  }

  componentDidMount = () => {
    this.updateHoverMenu();
  };

  componentDidUpdate = () => {
    this.updateHoverMenu();
  };

  getType = chars => {
    switch (chars) {
      case '*':
      case '-':
      case '+':
        return 'list-item';
      case '>':
        return 'block-quote';
      case '#':
        return 'heading-one';
      case '##':
        return 'heading-two';
      default:
        return null;
    }
  };

  onChange = ({ state }: Change) => {
    if (state.document !== this.state.state.document) {
      this.props.onChange(html.serialize(state));
    }

    this.setState({ state });
  };

  keyDownToggleMarks = (e: SyntheticInputEvent, data, change: Change) => {
    if (!data.isMod) return;
    let mark;
    switch (data.key) {
      case 'b':
        mark = 'bold';
        break;
      case 'i':
        mark = 'italic';
        break;
      case 'u':
        mark = 'underline';
        break;
      default:
        return;
    }

    e.preventDefault();
    change.toggleMark(mark);
    return true;
  };

  onKeyDown = (e: SyntheticInputEvent, data, change: Change) => {
    this.keyDownToggleMarks(e, data, change);
    switch (data.key) {
      case 'space':
        return this.onSpace(e, change);
      case 'backspace':
        return this.onBackspace(e, change);
      case 'enter':
        return this.onEnter(e, change);
    }
  };

  onSpace = (e: SyntheticInputEvent, change: Change) => {
    const { state } = change;
    if (state.isExpanded) return;

    const { startBlock, startOffset } = state;
    const chars = startBlock.text.slice(0, startOffset).replace(/\s*/g, '');
    const type = this.getType(chars);

    if (!type) return;
    if (type === 'list-item' && startBlock.type === 'list-item') return;
    e.preventDefault();

    change.setBlock(type);

    if (type === 'list-item') {
      change.wrapBlock('bulleted-list');
    }

    change.extendToStartOf(startBlock).delete();

    return true;
  };

  onBackspace = (e: SyntheticInputEvent, change: Change) => {
    const { state } = change;
    if (state.isExpanded) return;
    if (state.startOffset !== 0) return;

    const { startBlock } = state;
    if (startBlock.type === 'paragraph') return;

    e.preventDefault();
    change.setBlock('paragraph');

    if (startBlock.type === 'list-item') {
      change.unwrapBlock('bulleted-list');
    }

    return true;
  };

  onEnter = (e: SyntheticInputEvent, change: Change) => {
    const { state } = change;
    if (state.isExpanded) return;

    const { startBlock, startOffset, endOffset } = state;
    if (startOffset === 0 && startBlock.text.length === 0)
      return this.onBackspace(e, change);
    if (endOffset !== startBlock.text.length) return;

    if (
      startBlock.type !== 'heading-one' &&
      startBlock.type !== 'heading-two' &&
      startBlock.type !== 'block-quote'
    ) {
      return;
    }

    e.preventDefault();

    change.splitBlock().setBlock('paragraph');

    return true;
  };

  onToggleMark = (e: SyntheticInputEvent, type: MarkType) => {
    e.preventDefault();
    const change = this.state.state.change().toggleMark(type);
    this.onChange(change);
  };

  onToggleBlock = (e: SyntheticInputEvent, type: BlockType) => {
    e.preventDefault();
    const { state } = this.state;
    const change = state.change();
    const { document } = state;

    if (type !== 'bulleted-list' && type !== 'numbered-list') {
      const isActive = this.hasBlock(type);
      const isList = this.hasBlock('list-item');

      if (isList) {
        change
          .setBlock(isActive ? 'paragraph' : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else {
        change.setBlock(isActive ? 'paragraph' : type);
      }
    } else {
      const isList = this.hasBlock('list-item');
      const isType = state.blocks.some(
        block =>
          !!document.getClosest(block.key, parent => parent.type === type)
      );

      if (isList && isType) {
        change
          .setBlock('paragraph')
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else if (isList) {
        change
          .unwrapBlock(
            type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
          )
          .wrapBlock(type);
      } else {
        change.setBlock('list-item').wrapBlock(type);
      }
    }
    this.onChange(change);
  };

  hasBlock = (type: BlockType) => {
    const { state } = this.state;
    return state.blocks.some(node => node.type === type);
  };

  onOpenHoverMenu = portal => {
    this.setState({ menu: portal.firstChild });
  };

  updateHoverMenu = () => {
    const { menu, state } = this.state;
    if (!menu) return;

    if (state.isBlurred || state.isEmpty) {
      menu.removeAttribute('style');
      return;
    }

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    menu.style.opacity = 1;
    menu.style.top = `${rect.top + window.scrollY - menu.offsetHeight}px`;
    menu.style.left = `${rect.left +
      window.scrollX -
      menu.offsetWidth / 2 +
      rect.width / 2}px`;
  };

  render() {
    return (
      <div>
        <div className={styles.editor}>
          <HoverMenu
            onOpen={this.onOpenHoverMenu}
            state={this.state.state}
            onToggleBlock={this.onToggleBlock}
            onToggleMark={this.onToggleMark}
          />
          {/*<SideMenu state={this.state.state} />*/}
          <Editor
            schema={schema}
            state={this.state.state}
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
          />
          <div>{this.state.serialized}</div>
        </div>
      </div>
    );
  }
}

export default CustomEditor;
