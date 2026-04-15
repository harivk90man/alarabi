import Image from 'next/image'

export function Footer() {
  return (
    <footer
      className="w-full mt-auto"
      style={{ backgroundColor: '#0d3320', borderTop: '3px solid #16a34a' }}
    >
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left — Brand */}
        <div className="flex flex-col gap-2">
          <Image
            src="https://img1.wsimg.com/isteam/ip/c1812088-d5b4-4d7c-b39c-afa691bded3c/White%404x.png"
            alt="Al Arabi Plastic Factory"
            width={100}
            height={30}
            className="object-contain"
            unoptimized
          />
          <div>
            <div className="text-white text-sm font-semibold">Al Arabi Plastic Factory</div>
            <div className="text-white/70 text-xs">المصنع العربي للبلاستيك</div>
            <div className="text-white/50 text-xs mt-0.5">Est. 1983</div>
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
        </div>

        {/* Right — Legal */}
        <div className="text-white/50 text-xs text-right space-y-1">
          <div className="text-white/70">A subsidiary of AlKhudairi Group</div>
          <div>© 2026 Al Arabi Plastic Factory</div>
          <div>Internal Use Only · Maintenance Tracker v1.0</div>
        </div>
      </div>
    </footer>
  )
}
