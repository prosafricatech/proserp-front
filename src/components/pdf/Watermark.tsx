import { Text, View } from '@react-pdf/renderer'
import React from 'react'
import pdfStyles from './pdf-styles'

function Watermark() {
  return (
    <View style={pdfStyles.watermark}>
        <Text style={pdfStyles.watermarkText}>Watermark Text</Text>
    </View>
  )
}

export default Watermark