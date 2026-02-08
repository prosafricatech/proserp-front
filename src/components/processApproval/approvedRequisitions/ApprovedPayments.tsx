'use client'

import React from 'react'
import ApprovedRequisitionsRqList from './ApprovedRequisitionsRqList'

function ApprovedPayments() {
  return (
    <ApprovedRequisitionsRqList processType={'payment'}/>
  )
}

export default ApprovedPayments