'use client'
import React from 'react'

interface StatusCellProps {
  cellData: string
  rowData: any
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  send_now: 'Send Now',
  sent: 'Sent',
  failed: 'Failed',
}

export const StatusCell: React.FC<StatusCellProps> = ({ cellData }) => {
  const status = cellData as string
  const label = statusLabels[status] || status

  return <span>{label}</span>
}

export default StatusCell
