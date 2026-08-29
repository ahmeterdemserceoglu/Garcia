'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteUser } from './actions'

export function DeleteUserButton({ userId, userName }: { userId: string, userName: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete user ${userName}? This action cannot be undone.`)) {
      setIsDeleting(true)
      const res = await deleteUser(userId)
      if (!res.success) {
        alert('Failed to delete user: ' + res.error)
        setIsDeleting(false)
      }
      // If success, the page will revalidate and update automatically.
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-red-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-50"
      title="Delete User"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
