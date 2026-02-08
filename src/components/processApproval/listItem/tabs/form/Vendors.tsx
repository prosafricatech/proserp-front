import React, { useState } from 'react';
import ProductVendor from '../../../form/productVendor/ProductVendor';
import ProductVendorRow from '../../../form/productVendor/ProductVendorRow';
import { Vendor } from '@/components/processApproval/RequisitionType';

interface ProductItem {
  id: number;
  vendors?: Vendor[];
  [key: string]: any;
}

interface VendorsProps {
  setRequisition_product_items: (items: any) => void;
  product_item: ProductItem;
  index: number;
}

function Vendors({ setRequisition_product_items, product_item, index }: VendorsProps) {
  const [vendors, setVendors] = useState<Vendor[]>(
    product_item?.vendors 
      ? product_item.vendors.map(vendor => ({
          ...vendor,
          stakeholder_id: vendor.stakeholder_id ?? vendor.id
        })) 
      : []
  );

  return (
    <>
      <ProductVendor 
        isFromApproval={true} 
        vendorIndex={index} 
        setRequisition_product_items={setRequisition_product_items} 
        vendors={vendors} 
        setVendors={setVendors}
      />
      
      {vendors.map((vendor, vendorIndex) => (
        <ProductVendorRow 
          key={vendorIndex} 
          index={vendorIndex} 
          vendor={vendor} 
          vendors={vendors} 
          setVendors={setVendors}
          setRequisition_product_items={setRequisition_product_items}
        />
      ))}
    </>
  );
}

export default Vendors;