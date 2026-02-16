'use client'

import React from 'react'
import { useMediaQuery } from '@mui/material'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import Editor, { ContentEditableEvent } from 'react-simple-wysiwyg'

interface DescriptionTabProps {
  descriptionContent: string
  setDescriptionContent: (value: string) => void
}

const DescriptionTab: React.FC<DescriptionTabProps> = ({
  descriptionContent,
  setDescriptionContent,
}) => {
  const { theme } = useJumboTheme()
  const isBelowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'))

  const handleChange = (e: ContentEditableEvent) => {
    setDescriptionContent(e.target.value)
  }

  return (
    <div
      style={{
        width: '100%',
        borderRadius: '6px',
        padding: '8px',
        background: '#fff',
      }}
    >
      <Editor
        value={descriptionContent || ''}
        onChange={handleChange}
      />

      {!isBelowLargeScreen && (
        <style>
          {`
            .rsw-editor {
              min-height: 600px;
            }
          `}
        </style>
      )}
    </div>
  )
}

export default DescriptionTab
