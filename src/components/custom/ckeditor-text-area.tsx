import { useState, useEffect, useMemo } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { ClassicEditor, Autosave, Essentials, Paragraph, Bold, Italic, Heading, List, Markdown, type EditorConfig } from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import '@/app/globals.css';

const LICENSE_KEY = 'GPL';

type CKEditorTextAreaProps = {
    id?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    useMarkdown?: boolean;
};

const CKEditorTextArea: React.FC<CKEditorTextAreaProps> = ({ id, placeholder, value, onChange, useMarkdown }) => {
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    useEffect(() => {
        setIsLayoutReady(true);
        return () => setIsLayoutReady(false);
    }, []);

    const { editorConfig } = useMemo(() => {
        if (!isLayoutReady) {
            return {};
        }

        return {
            editorConfig: {
                placeholder: placeholder || 'Type or paste your content here!',
                toolbar: {
                    items: ['undo', 'redo', '|', 'heading', '|', 'bold', 'italic', '|', 'bulletedList', 'numberedList'],
                    shouldNotGroupWhenFull: false
                },
                plugins: useMarkdown ? [Autosave, Bold, Essentials, Heading, Italic, List, Paragraph, Markdown] : [Autosave, Bold, Essentials, Heading, Italic, List, Paragraph],
                licenseKey: LICENSE_KEY,
                heading: {
                    options: [
                        {
                            model: 'paragraph',
                            title: 'Paragraph',
                            class: 'ck-heading_paragraph'
                        },
                        {
                            model: 'heading1',
                            view: 'h1',
                            title: 'Heading 1',
                            class: 'ck-heading_heading1'
                        },
                        {
                            model: 'heading2',
                            view: 'h2',
                            title: 'Heading 2',
                            class: 'ck-heading_heading2'
                        },
                        {
                            model: 'heading3',
                            view: 'h3',
                            title: 'Heading 3',
                            class: 'ck-heading_heading3'
                        },
                        {
                            model: 'heading4',
                            view: 'h4',
                            title: 'Heading 4',
                            class: 'ck-heading_heading4'
                        },
                        {
                            model: 'heading5',
                            view: 'h5',
                            title: 'Heading 5',
                            class: 'ck-heading_heading5'
                        },
                        {
                            model: 'heading6',
                            view: 'h6',
                            title: 'Heading 6',
                            class: 'ck-heading_heading6'
                        }
                    ]
                }
            }
        };
    }, [isLayoutReady]);

    return (
        <div className='w-full h-full flex flex-col'>
            <div className="main-container">
                <div className="editor-container editor-container_classic-editor">
                    <div className="editor-container__editor">
                        {editorConfig && (
                            <CKEditor
                                id={id}
                                editor={ClassicEditor}
                                config={editorConfig as EditorConfig}
                                data={value ?? ""}
                                onChange={(_event, editor) => {
                                    onChange?.(editor.getData())
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CKEditorTextArea;
