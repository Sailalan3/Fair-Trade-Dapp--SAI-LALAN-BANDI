import React, { useState } from "react";

/**
 * Page-specific hero backgrounds with real images for each context.
 * Uses high-quality Unsplash images with dark overlays for text readability.
 */
export const PAGE_VIDEOS = {
  login: {
    src: "/login-bg.mp4",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80",
    gradient: "from-[#1d5c5c] via-[#1a4a4a] to-[#2c3e50]",
    overlay: "bg-gradient-to-b from-black/50 via-[#1a4a4a]/40 to-black/60",
  },
  register: {
    image: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=1920&q=80",
    gradient: "from-[#1a4a4a] via-[#2c3e50] to-[#1d5c5c]",
    overlay: "bg-gradient-to-b from-black/50 via-[#1a4a4a]/40 to-black/60",
  },
  farmer: {
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1920&q=80",
    gradient: "from-[#1d5c5c] via-[#2a7c7c] to-[#1a4a4a]",
    overlay: "bg-gradient-to-b from-black/40 via-[#1d5c5c]/30 to-black/60",
  },
  processor: {
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80",
    gradient: "from-[#2c3e50] via-[#1d5c5c] to-[#1a4a4a]",
    overlay: "bg-gradient-to-b from-black/50 via-[#2c3e50]/30 to-black/60",
  },
  exporter: {
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1920&q=80",
    gradient: "from-[#1d5c5c] via-[#2980b9] to-[#1a4a4a]",
    overlay: "bg-gradient-to-b from-black/40 via-[#0e7490]/20 to-black/60",
  },
  retailer: {
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80",
    gradient: "from-[#2c3e50] via-[#1d5c5c] to-[#2c3e50]",
    overlay: "bg-gradient-to-b from-black/50 via-[#2c3e50]/30 to-black/60",
  },
  transporter: {
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80",
    gradient: "from-[#1a4a4a] via-[#2c3e50] to-[#1d5c5c]",
    overlay: "bg-gradient-to-b from-black/50 via-[#1e293b]/30 to-black/60",
  },
  warehouse: {
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80",
    gradient: "from-[#2c3e50] via-[#1d5c5c] to-[#1a4a4a]",
    overlay: "bg-gradient-to-b from-black/50 via-[#2c3e50]/30 to-black/60",
  },
  receipts: {
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80",
    gradient: "from-[#1d5c5c] via-[#1a4a4a] to-[#2c3e50]",
    overlay: "bg-gradient-to-b from-black/50 via-[#1a4a4a]/30 to-black/60",
  },
  products: {
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80",
    gradient: "from-[#1d5c5c] via-[#2a7c7c] to-[#1d5c5c]",
    overlay: "bg-gradient-to-b from-black/40 via-[#1d5c5c]/30 to-black/60",
  },
  addProduct: {
    image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1920&q=80",
    gradient: "from-[#1a4a4a] via-[#2a7c7c] to-[#1d5c5c]",
    overlay: "bg-gradient-to-b from-black/40 via-[#1a4a4a]/30 to-black/60",
  },
  transactions: {
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&q=80",
    gradient: "from-[#2c3e50] via-[#1d5c5c] to-[#2c3e50]",
    overlay: "bg-gradient-to-b from-black/50 via-[#2c3e50]/30 to-black/60",
  },
  roaster: {
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&q=80",
    gradient: "from-[#2c3e50] via-[#1d5c5c] to-[#1a4a4a]",
    overlay: "bg-gradient-to-b from-black/50 via-[#2c3e50]/30 to-black/60",
  },
  tracking: {
    src: "/login-bg.mp4",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1920&q=80",
    gradient: "from-[#1d5c5c] via-[#2a7c7c] to-[#2c3e50]",
    overlay: "bg-gradient-to-b from-black/50 via-[#1d5c5c]/40 to-black/60",
  },
};

/**
 * WFTO-inspired hero/banner with background image + optional video.
 * Shows a real photo for each page context with a dark overlay for readability.
 */
export default function VideoHero({
  page = "login",
  title,
  subtitle,
  height = "h-64 md:h-80",
  fullScreen = false,
  children,
  className = "",
  overlay,
  innerPage = false,
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const config = PAGE_VIDEOS[page] || PAGE_VIDEOS.login;
  const videoSrc = config.src;

  const handleVideoError = () => {
    setVideoFailed(true);
  };

  const containerClass = fullScreen
    ? "min-h-screen"
    : innerPage
      ? `-mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 mb-8 ${height}`
      : height;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${containerClass} ${className}`}>
      {/* Background Image (always rendered as base layer) */}
      {config.image && (
        <img
          src={config.image}
          alt=""
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          style={{ filter: "brightness(0.45) saturate(1.2)" }}
        />
      )}

      {/* Video (on top of image, only for pages with video like login) */}
      {videoSrc && !videoFailed && (
        <video key={videoSrc} autoPlay loop muted playsInline onError={handleVideoError}
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ filter: "brightness(0.4) saturate(1.1)" }}>
          <source src={videoSrc} type={videoSrc.endsWith(".mov") ? "video/quicktime" : "video/mp4"} />
        </video>
      )}

      {/* Fallback gradient (if no image loaded) */}
      {!imgLoaded && <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />}

      {/* Overlay */}
      <div className={`absolute inset-0 ${overlay || config.overlay}`} />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Content */}
      <div className={`relative z-10 text-center px-6 ${fullScreen ? "" : "mt-10"} w-full max-w-4xl mx-auto`}>
        {title && (
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-lg uppercase"
            style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: "0.02em" }}>
            {title}
          </h1>
        )}
        {/* WFTO-style coral divider */}
        {title && <div className="w-16 h-[3px] bg-[#e8604c] mx-auto my-4" />}
        {subtitle && (
          <p className="text-white/80 text-sm md:text-base font-normal max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {/* Bottom fade for inner pages */}
      {!fullScreen && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f5f3ee] to-transparent" />
      )}
    </div>
  );
}
