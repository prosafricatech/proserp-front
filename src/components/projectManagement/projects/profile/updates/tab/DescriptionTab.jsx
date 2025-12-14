'use client'
import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import NestedList from '@editorjs/nested-list';
import Embed from '@editorjs/embed';
import Paragraph from '@editorjs/paragraph';
import Table from '@editorjs/table';
import Checklist from '@editorjs/checklist';
import Quote from '@editorjs/quote';
import InlineCode from '@editorjs/inline-code';
import Marker from '@editorjs/marker';
import Underline from '@editorjs/underline';
import { useMediaQuery } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

function DescriptionTab({ descriptionContent, setDescriptionContent, update }) {
    const { theme } = useJumboTheme();
    const isBelowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const editorInstance = useRef(null);

    const toolsConfig = React.useMemo(() => ({
        header: {
            class: Header,
            shortcut: 'CMD+SHIFT+H',
            inlineToolbar: true,
        },
        list: {
            class: NestedList,
            inlineToolbar: true,
            config: {
                defaultStyle: 'unordered',
            },
        },
        paragraph: {
            class: Paragraph,
            inlineToolbar: true,
            config: {
                preserveBlank: true,
            },
            sanitize: {
                b: true,
                i: true,
                a: {
                    href: true,
                    target: '_blank',
                },
            },
        },
        underline: Underline,
        embed: Embed,
        table: Table,
        checklist: Checklist,
        quote: Quote,
        inlineCode: InlineCode,
        marker: {
            class: Marker,
            shortcut: 'CMD+SHIFT+M',
        },
    }), []);

    useEffect(() => {
        const initializeEditor = () => {
            const parsedDescription =  descriptionContent
                ? JSON.parse(descriptionContent) 
                : {}; 

            if (!editorInstance.current) {
                editorInstance.current = new EditorJS({
                    holder: 'editor-js',
                    tools: toolsConfig,
                    autofocus: true,
                    data: parsedDescription,
                    onChange: async () => {
                        if (editorInstance.current) {
                            const content = await editorInstance.current.save();
                            setDescriptionContent(JSON.stringify(content));
                        }
                    },
                });
            }
        };

        initializeEditor();
    }, [descriptionContent, setDescriptionContent, toolsConfig, update?.description]);

    return (
        <div
            id="editor-js"
            style={{
                width: '100%',
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '4px',
                boxSizing: 'border-box',
            }}
        >
            {!isBelowLargeScreen &&
                <style>
                    {
                        `
                            #editor-js .ce-block__content, 
                            #editor-js .ce-toolbar__content {
                                max-width: calc(100% - 50px) !important;
                            }

                            #editor-js .cdx-block {
                                max-width: 100% !important;
                            }
                        `
                    }
                </style>
            }
        </div>
    );
}

export default DescriptionTab;
