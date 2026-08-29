'use client'

import { useState } from 'react'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      alert(isMaintenance ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled')
    }, 800)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Mode</h1>
        <p className="text-muted-foreground mt-1">
          Take the application offline. Users will see a maintenance screen and won't be able to log in.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className={`p-6 border-b border-border flex items-start gap-4 transition-colors ${isMaintenance ? 'bg-orange-500/10' : ''}`}>
          <div className={`p-3 rounded-full ${isMaintenance ? 'bg-orange-500/20' : 'bg-muted'}`}>
            <AlertTriangle className={`w-6 h-6 ${isMaintenance ? 'text-orange-600' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">Enable Maintenance Mode</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Active users will be disconnected. Only administrators will be able to access the admin panel.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer mt-2">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isMaintenance}
              onChange={(e) => setIsMaintenance(e.target.checked)}
            />
            <div className="w-14 h-7 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {isMaintenance && (
          <div className="p-6 bg-background space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message to Users</label>
              <textarea 
                rows={3} 
                defaultValue="We are currently down for scheduled maintenance. Please check back in a few hours."
                className="w-full bg-background border border-input rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Completion Time</label>
              <input 
                type="datetime-local" 
                className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          </div>
        )}

        <div className="p-6 bg-muted/20 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
