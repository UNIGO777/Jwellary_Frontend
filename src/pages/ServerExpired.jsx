export default function ServerExpired() {
  return (
    <div className="min-h-screen bg-[#fbf7f3] px-6 py-16 text-zinc-900">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wider text-zinc-500">System Notice</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">Server Expired</h1>

        <div className="mt-4 space-y-2 text-base font-semibold text-zinc-700">
          <div>Expire date: 16 FEB 2027</div>
          <div>Contact developer for upgrade package</div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-[#fbf7f3] p-5">
          <div className="text-sm font-semibold text-zinc-500">Developer</div>
          <div className="mt-1 text-lg font-extrabold text-zinc-900">Naman Jain</div>
          <a href="tel:7000610047" className="mt-2 inline-flex items-center gap-2 text-sm font-extrabold text-[#2b2118] hover:underline">
            7000610047
          </a>
        </div>
      </div>
    </div>
  )
}
