import { Image, Text } from '@react-pdf/renderer'
import React from 'react'
import pdfStyles from './pdf-styles'
import { Organization } from '@/types/auth-types'

function PdfLogo({organization}:{organization: Organization}) {
  return !!organization?.logo_path ? (
    <Image
      src={organization.logo_path}
    />
  ) : <Text style={pdfStyles.majorInfo}>{organization.name}</Text>
}

export default PdfLogo