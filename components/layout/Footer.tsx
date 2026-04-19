import Image from 'next/image'

export function Footer() {
  return (
    <footer
      className="w-full mt-auto"
      style={{ backgroundColor: 'var(--brand-primary)', borderTop: '3px solid var(--brand-accent)' }}
    >
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left — Brand */}
        <div className="flex flex-col gap-2">
          <Image
            src="/logo.png"
            alt="Al Arabi Plastic Factory"
            width={100}
            height={30}
            className="object-contain"
          />
          <div>
            <div className="text-white text-sm font-semibold">Al Arabi Plastic Factory</div>
            <div className="text-white/70 text-xs">المصنع العربي للبلاستيك</div>
            <div className="text-white/50 text-xs mt-0.5">A subsidiary of AlKhudairi Group · Est. 1983</div>
          </div>
        </div>

        {/* Center — Contact */}
        <div className="text-white/70 text-xs space-y-1">
          <div>Sabhan Industrial, Block 8, St 105</div>
          <div>Bldg 170, Kuwait</div>
          <div className="mt-1">
            <span>+965 2439 0000</span>
            <span className="mx-2">·</span>
            <span>info@arabiplastic.com</span>
          </div>
          <div className="mt-0.5">
            <span>arabiplastic.com</span>
          </div>
        </div>

        {/* Right — Certifications */}
        <div className="text-white/50 text-xs text-right space-y-1">
          <div className="text-white/70 font-medium">ISO 9001 · ISO 14001 · ISO 45001 Certified</div>
          <div>© 2026 Al Arabi Plastic Factory</div>
          <div>Internal Use Only · Maintenance Tracker v2.0</div>
        </div>
      </div>
    </footer>
  )
}
