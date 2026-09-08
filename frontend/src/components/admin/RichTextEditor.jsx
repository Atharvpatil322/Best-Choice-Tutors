/**
 * Rich Text Editor
 *
 * Toolbar-driven editor for blog content, built on TipTap. Produces HTML, and
 * accepts HTML back in, so what an author sees here is what the public page
 * renders.
 *
 * Tables are the reason this exists: because Table, TableRow, TableCell and
 * TableHeader are registered in the schema, a table copied from Word, Excel,
 * Google Docs or a web page survives a paste as a real table rather than
 * collapsing into a line of text. The same applies to headings, lists, links
 * and bold - pasted structure is kept when the schema has a node for it, and
 * dropped when it does not.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Link2,
  Link2Off,
  ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadBlogImageAdmin } from '@/services/blogService';
import './RichTextEditor.css';

/** Block types offered in the leftmost dropdown. */
const BLOCK_TYPES = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading-2', label: 'Heading 2' },
  { value: 'heading-3', label: 'Heading 3' },
  { value: 'heading-4', label: 'Heading 4' },
];

/**
 * One toolbar button.
 *
 * @param {Function} onClick - Command to run.
 * @param {boolean} [active] - Whether the mark or node is active at the cursor.
 * @param {boolean} [disabled] - Whether the command can run right now.
 * @param {string} title - Tooltip and accessible name.
 */
function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()} // keep the selection
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      className={`inline-flex items-center gap-1 h-8 px-2 rounded text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

/** Thin separator between toolbar groups. */
function Divider() {
  return <span className="w-px h-5 bg-slate-200 mx-1" aria-hidden />;
}

/**
 * @param {string} value - Current content as HTML.
 * @param {(html: string) => void} onChange - Receives HTML on every edit.
 * @param {string} [placeholder] - Shown while the document is empty.
 */
export default function RichTextEditor({ value, onChange, placeholder }) {
  const fileInputRef = useRef(null);
  const uploadingRef = useRef(false);

  const editor = useEditor({
    // TipTap 3 does not re-render React on each transaction by default, which
    // would leave the toolbar's active states and the table controls frozen at
    // whatever they were on mount. This editor is small enough that rendering
    // per transaction costs nothing and keeps the toolbar honest.
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        // Configured here rather than added separately: StarterKit already
        // bundles Link, and registering it twice throws.
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Image.configure({ HTMLAttributes: { class: 'rte-image' } }),
      // resizable adds the column handles authors expect from a word processor.
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rte-content',
        'data-placeholder': placeholder || 'Write your blog content here...',
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      // TipTap represents an empty document as an empty paragraph. Report that
      // as an empty string so the form's "content is required" check still works.
      onChange(instance.isEmpty ? '' : html);
    },
  });

  // Re-seed when the parent supplies different content, such as opening a
  // different post to edit. Skipped when the values already match, which would
  // otherwise reset the cursor on every keystroke.
  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (incoming === editor.getHTML()) return;
    if (incoming === '' && editor.isEmpty) return;
    editor.commands.setContent(incoming, { emitUpdate: false });
  }, [value, editor]);

  /** Apply the block type chosen in the dropdown. */
  const setBlockType = useCallback(
    (type) => {
      if (!editor) return;
      const chain = editor.chain().focus();
      if (type === 'paragraph') chain.setParagraph().run();
      else chain.setHeading({ level: Number(type.split('-')[1]) }).run();
    },
    [editor],
  );

  /** Current block type, so the dropdown reflects the cursor. */
  const currentBlockType = () => {
    if (!editor) return 'paragraph';
    for (const level of [2, 3, 4]) {
      if (editor.isActive('heading', { level })) return `heading-${level}`;
    }
    return 'paragraph';
  };

  /** Add or edit a link on the selection. An empty answer removes it. */
  const handleLink = useCallback(() => {
    if (!editor) return;
    const existing = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL (leave blank to remove):', existing);
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    // A bare domain would otherwise resolve against our own site.
    const href = /^(https?:|mailto:|tel:|\/)/i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }, [editor]);

  /** Upload the chosen file and insert it where the cursor is. */
  const handleImageFile = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = ''; // allow re-picking the same file
      if (!file || !editor) return;
      uploadingRef.current = true;
      try {
        const { imageUrl } = await uploadBlogImageAdmin(file);
        editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      } catch (err) {
        toast.error(err.message || 'Image upload failed');
      } finally {
        uploadingRef.current = false;
      }
    },
    [editor],
  );

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-40 rounded-lg border border-slate-200">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const inTable = editor.isActive('table');

  return (
    <div className="rte-wrapper rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-200 bg-slate-50 rounded-t-lg">
        <select
          value={currentBlockType()}
          onChange={(event) => setBlockType(event.target.value)}
          className="h-8 rounded border border-slate-200 bg-white px-2 text-sm text-slate-700 mr-1"
          title="Block type"
          aria-label="Block type"
        >
          {BLOCK_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <ToolbarButton
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Inline code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={15} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Code block"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={15} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={handleLink}>
          <Link2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Remove link"
          disabled={!editor.isActive('link')}
          onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
        >
          <Link2Off size={15} />
        </ToolbarButton>
        <ToolbarButton title="Image" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Insert table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <TableIcon size={15} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={15} />
        </ToolbarButton>
      </div>

      {/* Table controls appear only inside a table, so the main toolbar stays
          the length it is in the reference design. */}
      {inTable && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-indigo-50/60 text-xs">
          <span className="text-slate-500 mr-1">Table</span>
          <ToolbarButton title="Add row above" onClick={() => editor.chain().focus().addRowBefore().run()}>
            + Row above
          </ToolbarButton>
          <ToolbarButton title="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
            + Row below
          </ToolbarButton>
          <ToolbarButton title="Add column left" onClick={() => editor.chain().focus().addColumnBefore().run()}>
            + Col left
          </ToolbarButton>
          <ToolbarButton title="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            + Col right
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
            Delete row
          </ToolbarButton>
          <ToolbarButton title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
            Delete column
          </ToolbarButton>
          <ToolbarButton title="Merge or split cells" onClick={() => editor.chain().focus().mergeOrSplit().run()}>
            Merge/split
          </ToolbarButton>
          <ToolbarButton title="Toggle header row" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
            Header row
          </ToolbarButton>
          <Divider />
          <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 size={14} /> Delete table
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFile}
        className="hidden"
      />
    </div>
  );
}
