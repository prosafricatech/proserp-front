export const dynamic = "force-dynamic";
import PriceLists from '@/components/pos/priceLists/PriceLists'

function page() {
  return (
    <PriceLists fuelPriceLists={true}/>
  )
}

export default page