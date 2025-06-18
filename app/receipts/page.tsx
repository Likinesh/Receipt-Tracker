import PDFDropZone from '@/components/PDFDropZone'
import ReceiptList from '@/components/ReceiptList'

function Receipt() {
  return (
    <div className='container mx-auto py-10 px-4 sm:px-6 lg:px=8'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-10'>
            <PDFDropZone />
            <ReceiptList />
        </div>
    </div>
  )
}

export default Receipt