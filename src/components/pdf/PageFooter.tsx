import React from 'react'
import pdfStyles from './pdf-styles'
import { Text, View } from '@react-pdf/renderer'

function PageFooter() {
  return (
    <View style={pdfStyles.footer}>
        <Text>Powered by: proserp.co.tz</Text>
    </View>
  )
}

export default PageFooter