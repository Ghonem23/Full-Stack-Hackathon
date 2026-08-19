import DoctorRobot from '@/features/signup/DoctorRobot'
import { PulseLogoIcon } from '@/components/icons'
import { MODEL_NAME } from '@/config'

/** Left-hand brand panel. Hidden below `lg` — the form takes the full width there. */
export default function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden lg:flex lg:w-[54%] lg:shrink-0">
      {/* Brand gradient: navy → primary blue → teal */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-600 via-primary-600 to-teal-500" />

      {/* Soft light blooms for depth */}
      <div className="animate-pulse-slow absolute -top-24 -left-16 size-96 rounded-full bg-teal-300/25 blur-3xl" />
      <div className="absolute -right-24 bottom-0 size-[26rem] rounded-full bg-primary-300/20 blur-3xl" />

      {/* Faint clinical grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Animated EKG trace along the bottom */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-32 w-full text-white/25"
      >
        <path
          className="ekg-trace"
          d="M0 70h60l14-34 20 68 18-52 12 26 16-8h64l14-34 20 68 18-52 12 26 16-8h64l14-34 20 68 18-52 12 26 16-8h64l14-34 20 68 18-52 12 26 16-8h60"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="relative z-10 flex w-full flex-col gap-6 p-10 xl:p-14">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/25 bg-white/15 backdrop-blur-sm">
            <PulseLogoIcon className="size-6 text-white" strokeWidth={2} />
          </span>
          <span className="text-xl font-bold tracking-tight text-white">{MODEL_NAME}</span>
        </div>

        {/* The robot gets whatever vertical room is left over */}
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <DoctorRobot className="animate-float h-full max-h-[19rem] w-auto drop-shadow-2xl" />
        </div>

        <div>
          <h2 className="text-[2rem] leading-[1.2] font-bold text-white xl:text-[2.35rem]">
            How your mind
            <br />
            shapes your immunity.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/80 xl:text-xl">
            Ask about the relationship between depression and the immune system, and get an answer
            drawn from published research — in plain language.
          </p>
        </div>
      </div>
    </aside>
  )
}
