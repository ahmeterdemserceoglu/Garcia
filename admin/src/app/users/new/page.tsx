import { createUser } from './actions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewUserPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/users" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
        <p className="text-muted-foreground mt-1">
          Manually add a real user to the platform.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <form action={createUser} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Full Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              placeholder="e.g. Ceyda Yılmaz"
              className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                placeholder="e.g. ceyda@example.com"
                className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                placeholder="Min 8 characters"
                className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium">Gender</label>
              <select 
                id="gender" 
                name="gender" 
                required
                className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="NON_BINARY">Non-Binary</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="birthDate" className="text-sm font-medium">Birth Date</label>
              <input 
                type="date" 
                id="birthDate" 
                name="birthDate" 
                required 
                className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">City (Şehir)</label>
              <input 
                type="text" 
                id="city" 
                name="city" 
                placeholder="e.g. Ankara"
                className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="district" className="text-sm font-medium">District (İlçe)</label>
              <input 
                type="text" 
                id="district" 
                name="district" 
                placeholder="e.g. Çankaya"
                className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="photos" className="text-sm font-medium">Profile Photos (Çoklu Resim Yükle)</label>
            <input 
              type="file" 
              id="photos" 
              name="photos" 
              accept="image/*"
              multiple
              required 
              className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can select multiple photos (CTRL/CMD + Click). The first photo will be set as the main profile photo.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground font-medium rounded-lg px-4 py-3 hover:bg-primary/90 transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
