import React from 'react';
import pdfStyles from './pdf-styles';
import { Text, View } from '@react-pdf/renderer';
import { Organization } from '@/types/auth-types';
import { Stakeholder } from '../masters/stakeholders/StakeholderType';

// Define type for order
interface Order {
  paid_from?: {
    name: string;
  };
}

// Define props for the component
interface DocumentStakeholdersProps {
  organization: Organization;
  stakeholder: Stakeholder;
  fromLabel?: string;
  toLabel?: string;
  order?: Order;
}

const DocumentStakeholders: React.FC<DocumentStakeholdersProps> = ({
  organization,
  stakeholder,
  fromLabel = 'BILL FROM',
  toLabel = 'BILL TO',
  order
}) => {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  return (
    <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
      <View style={{ flex: 2, padding: 2 }}>
        <Text 
          style={{
            ...pdfStyles.tableHeader, 
            backgroundColor: mainColor, 
            color: contrastText 
          }}
        >
          {fromLabel}
        </Text>
        <Text style={pdfStyles.minInfo}>{organization.name}</Text>
        {organization?.tin && <Text style={pdfStyles.minInfo}>{`TIN: ${organization.tin}`}</Text>}
        {organization?.settings?.vrn && <Text style={pdfStyles.minInfo}>{`VRN: ${organization.settings.vrn}`}</Text>}
        {organization?.phone && <Text style={pdfStyles.minInfo}>{`Phone: ${organization.phone}`}</Text>}
        {organization?.email && <Text style={pdfStyles.minInfo}>{`${organization.email}`}</Text>}
        {organization?.address && <Text style={pdfStyles.minInfo}>{`${organization.address}`}</Text>}
      </View>
      
      <View style={{ flex: 1 }}></View>
      
      <View style={{ flex: 2, padding: 1, textAlign: 'right' }}>
        <Text 
          style={{
            ...pdfStyles.tableHeader, 
            backgroundColor: mainColor, 
            color: contrastText,
            textAlign: 'left'
          }}
        >
          {toLabel}
        </Text>
        <Text style={pdfStyles.minInfo}>{stakeholder.name}</Text>
        {stakeholder?.tin && <Text style={pdfStyles.minInfo}>{`TIN: ${stakeholder.tin}`}</Text>}
        {stakeholder?.vrn && <Text style={pdfStyles.minInfo}>{`VRN: ${stakeholder.vrn}`}</Text>}
        {stakeholder?.phone && <Text style={pdfStyles.minInfo}>{`Phone: ${stakeholder.phone}`}</Text>}
        {stakeholder?.email && <Text style={pdfStyles.minInfo}>{`${stakeholder.email}`}</Text>}
        {stakeholder?.address && <Text style={pdfStyles.minInfo}>{`${stakeholder.address}`}</Text>}
        
        {order?.paid_from && 
          <View style={{ ...pdfStyles.tableRow, ...pdfStyles.midInfo, marginTop: 5 }}>
            <View style={{ textAlign: 'right', flex: 1 }}>
              <Text style={{ color: mainColor }}>Paid From: </Text>
            </View>
            <View style={{ ...pdfStyles.minInfo, textAlign: 'right', flex: 1 }}>
              <Text>{order.paid_from.name}</Text>
            </View>
          </View>
        }
      </View>
    </View> 
  );
};

export default DocumentStakeholders;