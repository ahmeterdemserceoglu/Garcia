'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, User as UserIcon, Images } from 'lucide-react'

interface Photo {
  id: string
  url: string
  isMain: boolean
  order: number
}

interface PhotoGalleryProps {
  photos: Photo[]
  userName: string
}

export function PhotoGallery({ photos, userName }: PhotoGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const sorted = [...photos].sort((a, b) => a.order - b.order)
  const mainPhoto = sorted.find(p => p.isMain) || sorted[0]

  const prev = () => setActiveIndex(i => (i - 1 + sorted.length) % sorted.length)
  const next = () => setActiveIndex(i => (i + 1) % sorted.length)

  const openAt = (idx: number) => {
    setActiveIndex(idx)
    setIsOpen(true)
  }

  return (
    <>
      {/* Clickable profile photo */}
      <div
        className="aspect-[3/4] bg-muted relative cursor-pointer group"
        onClick={() => openAt(0)}
      >
        {mainPhoto ? (
          <img
            src={mainPhoto.url}
            alt="Profile"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserIcon className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Photo count badge */}
        {sorted.length > 1 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-full text-xs font-semibold text-white border border-white/10">
            <Images className="w-3.5 h-3.5" />
            {sorted.length} foto
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/50 px-3 py-1 rounded-full">
            Tüm fotoğrafları gör
          </span>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          <div className="relative w-full max-w-3xl mx-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <h3 className="text-white font-bold text-lg">{userName}</h3>
                <p className="text-white/50 text-sm">{activeIndex + 1} / {sorted.length}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative aspect-[3/4] max-h-[70vh] rounded-xl overflow-hidden bg-muted/20">
              <img
                key={sorted[activeIndex]?.id}
                src={sorted[activeIndex]?.url}
                alt={`Photo ${activeIndex + 1}`}
                className="w-full h-full object-contain"
              />

              {sorted.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white border border-white/10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white border border-white/10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {sorted.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1 px-1 justify-center">
                {sorted.map((photo, idx) => (
                  <button
                    key={photo.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeIndex
                        ? 'border-primary scale-105 shadow-lg shadow-primary/30'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
